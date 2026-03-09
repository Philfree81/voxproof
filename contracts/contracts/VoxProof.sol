// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VoxProof
 * @notice Ancre des preuves de certification vocale sur Avalanche C-Chain.
 *
 * @dev Conformité RGPD (articles 6 et 17) :
 *      Seuls des hashes cryptographiques SHA-256 sont stockés sur la blockchain.
 *      - audioHash : empreinte unique de la session (irréversible, non identifiant direct)
 *      - voiceHash : identité biométrique vocale stable (irréversible)
 *      Aucun identifiant liant la preuve à une personne physique (email, UUID session,
 *      CID IPFS) n'est inscrit on-chain. L'immuabilité de la blockchain est ainsi
 *      compatible avec le droit à l'effacement : les données personnelles restent
 *      exclusivement dans les systèmes révocables d'Adelray SAS (base PostgreSQL,
 *      stockage IPFS temporaire à J+5), jamais sur la chaîne publique.
 */
contract VoxProof is Ownable, Pausable, ReentrancyGuard {

    // ─── Structs ────────────────────────────────────────────────

    struct Proof {
        uint256 id;
        address owner;        // VoxProof deployer wallet — signs on behalf of end users
        bytes32 audioHash;    // SHA-256 des features ComParE — unique par session
        bytes32 voiceHash;    // SHA-256 du d-vector GE2E — identité biométrique stable
        string  title;        // Libellé générique (ex: "VoxProof Vocal Signature")
        uint256 timestamp;    // Horodatage blockchain (block.timestamp)
        bool    revoked;      // Révocation possible par le propriétaire (non-suppression)
    }

    // ─── State ──────────────────────────────────────────────────

    uint256 private _proofCounter;

    // proofId => Proof
    mapping(uint256 => Proof) private _proofs;

    // wallet address => liste des proofIds
    mapping(address => uint256[]) private _userProofs;

    // audioHash => proofId (empêche le double ancrage d'une même session)
    mapping(bytes32 => uint256) private _hashToProofId;

    // voiceHash => liste de proofIds (une voix peut avoir plusieurs sessions)
    mapping(bytes32 => uint256[]) private _voiceHashToProofIds;

    // ─── Events ─────────────────────────────────────────────────

    event ProofAnchored(
        uint256 indexed proofId,
        address indexed owner,
        bytes32 indexed audioHash,
        bytes32 voiceHash,
        string  title,
        uint256 timestamp
    );

    event ProofRevoked(
        uint256 indexed proofId,
        address indexed owner,
        uint256 timestamp
    );

    // ─── Errors ─────────────────────────────────────────────────

    error HashAlreadyAnchored(bytes32 audioHash, uint256 existingProofId);
    error ProofNotFound(uint256 proofId);
    error NotProofOwner(uint256 proofId, address caller);
    error ProofAlreadyRevoked(uint256 proofId);
    error EmptyHash();

    // ─── Constructor ────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── External functions ─────────────────────────────────────

    /**
     * @notice Ancre une nouvelle preuve vocale on-chain.
     * @dev    Aucun identifiant personnel n'est transmis — uniquement des hashes.
     * @param audioHash  SHA-256 des features acoustiques de la session (bytes32)
     * @param voiceHash  SHA-256 de l'identité biométrique vocale (bytes32)
     * @param title      Libellé générique, non personnel (ex: "VoxProof Vocal Signature")
     * @return proofId   Identifiant séquentiel de la preuve créée
     */
    function anchorProof(
        bytes32 audioHash,
        bytes32 voiceHash,
        string calldata title
    ) external whenNotPaused nonReentrant returns (uint256 proofId) {
        if (audioHash == bytes32(0)) revert EmptyHash();
        if (_hashToProofId[audioHash] != 0) {
            revert HashAlreadyAnchored(audioHash, _hashToProofId[audioHash]);
        }

        _proofCounter++;
        proofId = _proofCounter;

        _proofs[proofId] = Proof({
            id:        proofId,
            owner:     msg.sender,
            audioHash: audioHash,
            voiceHash: voiceHash,
            title:     title,
            timestamp: block.timestamp,
            revoked:   false
        });

        _userProofs[msg.sender].push(proofId);
        _hashToProofId[audioHash] = proofId;
        if (voiceHash != bytes32(0)) {
            _voiceHashToProofIds[voiceHash].push(proofId);
        }

        emit ProofAnchored(proofId, msg.sender, audioHash, voiceHash, title, block.timestamp);
    }

    /**
     * @notice Révoque une preuve. Ne la supprime pas — la révocation est permanente
     *         et publiquement visible. Permet à un utilisateur de signaler qu'une
     *         certification ne doit plus être considérée comme valide.
     * @param proofId  Identifiant de la preuve à révoquer
     */
    function revokeProof(uint256 proofId) external whenNotPaused {
        Proof storage proof = _getProof(proofId);
        if (proof.owner != msg.sender) revert NotProofOwner(proofId, msg.sender);
        if (proof.revoked) revert ProofAlreadyRevoked(proofId);

        proof.revoked = true;
        emit ProofRevoked(proofId, msg.sender, block.timestamp);
    }

    // ─── View functions ─────────────────────────────────────────

    /**
     * @notice Retourne une preuve complète par son ID.
     */
    function getProof(uint256 proofId) external view returns (Proof memory) {
        return _getProof(proofId);
    }

    /**
     * @notice Retourne tous les IDs de preuves appartenant à une adresse wallet.
     */
    function getUserProofIds(address user) external view returns (uint256[] memory) {
        return _userProofs[user];
    }

    /**
     * @notice Vérifie si un hash audio a déjà été ancré.
     * @return exists    Vrai si ancré
     * @return proofId   ID de la preuve (0 si introuvable)
     * @return revoked   Vrai si la preuve a été révoquée
     */
    function verifyHash(bytes32 audioHash)
        external
        view
        returns (bool exists, uint256 proofId, bool revoked)
    {
        proofId = _hashToProofId[audioHash];
        if (proofId == 0) return (false, 0, false);
        exists = true;
        revoked = _proofs[proofId].revoked;
    }

    /**
     * @notice Nombre total de preuves ancrées depuis le déploiement.
     */
    function totalProofs() external view returns (uint256) {
        return _proofCounter;
    }

    /**
     * @notice Retourne tous les IDs de preuves liés à une empreinte vocale biométrique.
     *         Permet de vérifier qu'une voix a déjà été certifiée.
     */
    function getProofsByVoiceHash(bytes32 voiceHash) external view returns (uint256[] memory) {
        return _voiceHashToProofIds[voiceHash];
    }

    // ─── Admin ──────────────────────────────────────────────────

    /// @notice Pause toutes les opérations d'ancrage (urgence).
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Reprend les opérations après une pause.
    function unpause() external onlyOwner {
        _unpause();
    }

    // ─── Internal ───────────────────────────────────────────────

    function _getProof(uint256 proofId) internal view returns (Proof storage) {
        if (proofId == 0 || proofId > _proofCounter) revert ProofNotFound(proofId);
        return _proofs[proofId];
    }
}

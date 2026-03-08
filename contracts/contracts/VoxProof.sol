// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VoxProof
 * @notice Anchors voice recording proofs on Avalanche C-Chain.
 *         Each proof binds a SHA-256 audio hash to an IPFS CID,
 *         a wallet address, and a block timestamp — creating an
 *         immutable, publicly verifiable certificate of existence.
 */
contract VoxProof is Ownable, Pausable, ReentrancyGuard {

    // ─── Structs ────────────────────────────────────────────────

    struct Proof {
        uint256 id;
        address owner;
        bytes32 audioHash;    // SHA-256 of ComParE features — unique per session
        bytes32 voiceHash;    // SHA-256 of Resemblyzer d-vector — stable biometric identity
        string  ipfsCid;      // IPFS Content ID (CID v1)
        string  title;        // Optional title given by the user
        uint256 timestamp;    // Block timestamp at anchoring time
        bool    revoked;      // Owner can mark as revoked (not deleted)
    }

    // ─── State ──────────────────────────────────────────────────

    uint256 private _proofCounter;

    // proofId => Proof
    mapping(uint256 => Proof) private _proofs;

    // wallet address => list of proof IDs
    mapping(address => uint256[]) private _userProofs;

    // audioHash => proofId (to prevent duplicate anchoring)
    mapping(bytes32 => uint256) private _hashToProofId;

    // voiceHash => list of proofIds (one voice identity can have multiple sessions)
    mapping(bytes32 => uint256[]) private _voiceHashToProofIds;

    // ─── Events ─────────────────────────────────────────────────

    event ProofAnchored(
        uint256 indexed proofId,
        address indexed owner,
        bytes32 indexed audioHash,
        bytes32 voiceHash,
        string  ipfsCid,
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
    error EmptyCid();

    // ─── Constructor ────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── External functions ─────────────────────────────────────

    /**
     * @notice Anchor a new voice proof on-chain.
     * @param audioHash  SHA-256 hash of the audio file (bytes32)
     * @param ipfsCid    IPFS CID where the audio is pinned
     * @param title      Optional human-readable title
     * @return proofId   The newly created proof ID
     */
    function anchorProof(
        bytes32 audioHash,
        bytes32 voiceHash,
        string calldata ipfsCid,
        string calldata title
    ) external whenNotPaused nonReentrant returns (uint256 proofId) {
        if (audioHash == bytes32(0)) revert EmptyHash();
        if (bytes(ipfsCid).length == 0) revert EmptyCid();
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
            ipfsCid:   ipfsCid,
            title:     title,
            timestamp: block.timestamp,
            revoked:   false
        });

        _userProofs[msg.sender].push(proofId);
        _hashToProofId[audioHash] = proofId;
        if (voiceHash != bytes32(0)) {
            _voiceHashToProofIds[voiceHash].push(proofId);
        }

        emit ProofAnchored(proofId, msg.sender, audioHash, voiceHash, ipfsCid, title, block.timestamp);
    }

    /**
     * @notice Revoke a proof. Does not delete it — revocation is permanent and visible.
     * @param proofId  The proof to revoke
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
     * @notice Get full proof details by ID.
     */
    function getProof(uint256 proofId) external view returns (Proof memory) {
        return _getProof(proofId);
    }

    /**
     * @notice Get all proof IDs belonging to a wallet address.
     */
    function getUserProofIds(address user) external view returns (uint256[] memory) {
        return _userProofs[user];
    }

    /**
     * @notice Verify whether a given audio hash has been anchored.
     * @return exists    True if anchored
     * @return proofId   The proof ID (0 if not found)
     * @return revoked   Whether the proof has been revoked
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
     * @notice Total number of proofs ever anchored.
     */
    function totalProofs() external view returns (uint256) {
        return _proofCounter;
    }

    // ─── Admin ──────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get all proof IDs anchored for a given voice identity hash.
     *         Allows verifying that a voice has been certified before.
     */
    function getProofsByVoiceHash(bytes32 voiceHash) external view returns (uint256[] memory) {
        return _voiceHashToProofIds[voiceHash];
    }

    // ─── Internal ───────────────────────────────────────────────

    function _getProof(uint256 proofId) internal view returns (Proof storage) {
        if (proofId == 0 || proofId > _proofCounter) revert ProofNotFound(proofId);
        return _proofs[proofId];
    }
}

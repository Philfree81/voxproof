import { ethers } from 'ethers'
import { env } from '../config/env'

const ABI = [
  'function anchorProof(bytes32 audioHash, string calldata ipfsCid, string calldata title) external returns (uint256)',
  'function revokeProof(uint256 proofId) external',
  'function getProof(uint256 proofId) external view returns (tuple(uint256 id, address owner, bytes32 audioHash, string ipfsCid, string title, uint256 timestamp, bool revoked))',
  'function verifyHash(bytes32 audioHash) external view returns (bool exists, uint256 proofId, bool revoked)',
  'function getUserProofIds(address user) external view returns (uint256[])',
  'function totalProofs() external view returns (uint256)',
  'event ProofAnchored(uint256 indexed proofId, address indexed owner, bytes32 indexed audioHash, string ipfsCid, string title, uint256 timestamp)',
]

function getProvider() {
  const rpcUrl = env.nodeEnv === 'production' ? env.avalancheRpcUrl : env.avalancheTestnetRpcUrl
  return new ethers.JsonRpcProvider(rpcUrl)
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || getProvider()
  return new ethers.Contract(env.contractAddress, ABI, provider)
}

/**
 * Anchor a proof on-chain using the platform wallet (backend pays gas — adjust if users pay).
 * For user-pays model, this should be called from the frontend directly.
 */
export async function anchorProofOnChain(
  audioHashHex: string,
  ipfsCid: string,
  title: string
): Promise<{ txHash: string; proofId: number; blockNumber: number }> {
  const provider = getProvider()
  const signer = new ethers.Wallet(env.deployerPrivateKey, provider)
  const contract = getContract(signer)

  const audioHashBytes = ethers.hexlify(
    Buffer.from(audioHashHex.replace('0x', ''), 'hex')
  ) as `0x${string}`

  const tx = await contract.anchorProof(audioHashBytes, ipfsCid, title)
  const receipt = await tx.wait()

  const event = receipt.logs
    .map((log: ethers.Log) => {
      try { return contract.interface.parseLog(log) } catch { return null }
    })
    .find((e: ethers.LogDescription | null) => e?.name === 'ProofAnchored')

  return {
    txHash: receipt.hash,
    proofId: Number(event?.args?.proofId || 0),
    blockNumber: receipt.blockNumber,
  }
}

export async function verifyHashOnChain(
  audioHashHex: string
): Promise<{ exists: boolean; proofId: number; revoked: boolean }> {
  const contract = getContract()
  const audioHashBytes = ethers.hexlify(Buffer.from(audioHashHex.replace('0x', ''), 'hex'))
  const [exists, proofId, revoked] = await contract.verifyHash(audioHashBytes)
  return { exists, proofId: Number(proofId), revoked }
}

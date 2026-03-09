import { ethers } from 'ethers'
import { env } from '../config/env'
import twilio from 'twilio'

function sendRpcAlert(message: string) {
  console.error(`[BLOCKCHAIN ERROR] ${message}`)
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.notifyWhatsappTo) return
  const client = twilio(env.twilioAccountSid, env.twilioAuthToken)
  client.messages.create({
    from: env.twilioWhatsappFrom,
    to: env.notifyWhatsappTo,
    body: `🚨 VoxProof Blockchain\n${message}`,
  }).catch(err => console.error('[Twilio] Failed to send alert:', err))
}

const ABI = [
  'function anchorProof(bytes32 audioHash, bytes32 voiceHash, string calldata ipfsCid, string calldata title) external returns (uint256)',
  'function getProofsByVoiceHash(bytes32 voiceHash) external view returns (uint256[])',
  'function verifyHash(bytes32 audioHash) external view returns (bool exists, uint256 proofId, bool revoked)',
  'function totalProofs() external view returns (uint256)',
  'event ProofAnchored(uint256 indexed proofId, address indexed owner, bytes32 indexed audioHash, bytes32 voiceHash, string ipfsCid, string title, uint256 timestamp)',
]

function getProvider() {
  return new ethers.JsonRpcProvider(env.blockchainRpcUrl)
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(env.contractAddress, ABI, signerOrProvider || getProvider())
}

/**
 * Anchor an acoustic hash on-chain.
 * The hash is a SHA-256 hex string from ComParE features.
 * sessionId is stored as the ipfsCid field (repurposed as a unique identifier).
 */
export async function anchorHashOnChain(
  acousticHashHex: string,
  voiceHashHex: string,
  sessionId: string,
): Promise<{ txHash: string; blockNumber: number }> {
  const provider = getProvider()
  const signer = new ethers.Wallet(env.deployerPrivateKey, provider)
  const contract = getContract(signer)

  const hashBytes = ethers.hexlify(
    Buffer.from(acousticHashHex.replace('0x', ''), 'hex')
  ) as `0x${string}`

  const voiceHashBytes = ethers.hexlify(
    Buffer.from(voiceHashHex.replace('0x', ''), 'hex')
  ) as `0x${string}`

  try {
    const tx = await contract.anchorProof(hashBytes, voiceHashBytes, sessionId, 'VoxProof Vocal Signature')
    const receipt = await tx.wait()
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    const is429 = msg.includes('429') || msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('rate limit')
    if (is429) {
      sendRpcAlert(`RPC 429 Too Many Requests\nEndpoint: ${env.blockchainRpcUrl}\nSession: ${sessionId}\nSolution: changer BLOCKCHAIN_RPC_URL`)
    } else {
      sendRpcAlert(`Ancrage échoué\nSession: ${sessionId}\nErreur: ${msg.slice(0, 200)}`)
    }
    throw err
  }
}

export async function verifyHashOnChain(
  acousticHashHex: string,
): Promise<{ exists: boolean; proofId: number; revoked: boolean }> {
  const contract = getContract()
  const hashBytes = ethers.hexlify(Buffer.from(acousticHashHex.replace('0x', ''), 'hex'))
  const [exists, proofId, revoked] = await contract.verifyHash(hashBytes)
  return { exists, proofId: Number(proofId), revoked }
}

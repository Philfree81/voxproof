import { Response } from 'express'
import { prisma } from '../config/database'
import { anchorProofOnChain, verifyHashOnChain } from '../services/blockchainService'
import { AuthRequest } from '../middleware/auth'

export async function anchorProof(req: AuthRequest, res: Response) {
  const record = await prisma.voiceRecord.findFirst({
    where: { id: req.params.recordId, userId: req.userId },
    include: { proof: true },
  })
  if (!record) return res.status(404).json({ error: 'Record not found' })
  if (record.proof) return res.status(409).json({ error: 'Record already anchored', proof: record.proof })

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user?.walletAddress) {
    return res.status(400).json({ error: 'Connect your wallet before anchoring a proof' })
  }

  const { txHash, proofId, blockNumber } = await anchorProofOnChain(
    record.audioHash,
    record.ipfsCid,
    record.title
  )

  const proof = await prisma.proof.create({
    data: {
      recordId: record.id,
      txHash,
      contractProofId: proofId,
      blockNumber,
      chainId: parseInt(process.env.VITE_AVALANCHE_CHAIN_ID || '43114'),
      network: process.env.NODE_ENV === 'production' ? 'avalanche' : 'fuji',
    },
  })

  return res.status(201).json(proof)
}

export async function getProof(req: AuthRequest, res: Response) {
  const proof = await prisma.proof.findFirst({
    where: {
      id: req.params.id,
      record: { userId: req.userId },
    },
    include: { record: true },
  })
  if (!proof) return res.status(404).json({ error: 'Proof not found' })
  return res.json(proof)
}

export async function verifyProof(req: Request, res: Response) {
  const { hash } = req.params
  const result = await verifyHashOnChain(hash)
  return (res as Response).json(result)
}

import { Response } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../config/database'
import { uploadAudioToIPFS } from '../services/ipfsService'
import { AuthRequest } from '../middleware/auth'

const PLAN_LIMITS: Record<string, number> = {
  STARTER: 10,
  PRO: 100,
  ENTERPRISE: Infinity,
}

async function checkRecordLimit(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } })
  const plan = subscription?.plan || 'STARTER'
  const limit = PLAN_LIMITS[plan]

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const count = await prisma.voiceRecord.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })
  return count < limit
}

export async function uploadRecord(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ error: 'Audio file required' })

  const withinLimit = await checkRecordLimit(req.userId!)
  if (!withinLimit) {
    return res.status(429).json({ error: 'Monthly recording limit reached. Upgrade your plan.' })
  }

  const { title, description } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })

  const audioBuffer = req.file.buffer
  const audioHash = crypto.createHash('sha256').update(audioBuffer).digest('hex')

  const existing = await prisma.voiceRecord.findUnique({ where: { audioHash } })
  if (existing) {
    return res.status(409).json({ error: 'This exact audio file has already been uploaded', recordId: existing.id })
  }

  const { cid, url } = await uploadAudioToIPFS(audioBuffer, req.file.originalname, req.userId!)

  const record = await prisma.voiceRecord.create({
    data: {
      userId: req.userId!,
      title,
      description,
      ipfsCid: cid,
      audioHash,
      fileSizeBytes: audioBuffer.length,
      mimeType: req.file.mimetype,
    },
  })

  return res.status(201).json({ ...record, ipfsUrl: url })
}

export async function getRecords(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
  const skip = (page - 1) * limit

  const [records, total] = await Promise.all([
    prisma.voiceRecord.findMany({
      where: { userId: req.userId },
      include: { proof: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.voiceRecord.count({ where: { userId: req.userId } }),
  ])

  return res.json({
    data: records,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function getRecord(req: AuthRequest, res: Response) {
  const record = await prisma.voiceRecord.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { proof: true },
  })
  if (!record) return res.status(404).json({ error: 'Record not found' })
  return res.json(record)
}

export async function deleteRecord(req: AuthRequest, res: Response) {
  const record = await prisma.voiceRecord.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { proof: true },
  })
  if (!record) return res.status(404).json({ error: 'Record not found' })
  if (record.proof) {
    return res.status(400).json({ error: 'Cannot delete a record that has been anchored on-chain' })
  }

  await prisma.voiceRecord.delete({ where: { id: record.id } })
  return res.status(204).send()
}

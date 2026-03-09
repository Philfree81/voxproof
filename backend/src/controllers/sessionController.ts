import { Response } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { sessionQueue } from '../services/sessionQueue'
import { env } from '../config/env'
import { logActivity } from '../services/activityService'

export async function createSession(req: AuthRequest, res: Response) {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length !== 5) {
    return res.status(400).json({ error: 'Exactly 5 audio files are required' })
  }

  const { language = 'fr', textSetId, withIdentityVerification } = req.body

  // Resolve text set
  let resolvedSet: { id: string; name: string } | null = null
  if (textSetId) {
    resolvedSet = await prisma.textSet.findFirst({
      where: { id: textSetId, isActive: true },
      select: { id: true, name: true },
    })
    if (!resolvedSet) return res.status(400).json({ error: 'Invalid or inactive textSetId' })
  } else {
    resolvedSet = await prisma.textSet.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    })
    if (!resolvedSet) return res.status(400).json({ error: 'No active text set found' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Find unused purchase credit
  const purchase = await prisma.purchase.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (env.nodeEnv !== 'development' && !purchase) {
    return res.status(402).json({ error: 'purchase_required', message: 'A purchase is required to create a session.' })
  }

  const validUntil = purchase
    ? purchase.validUntil
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  const kycVerified = withIdentityVerification === 'true' && !!user.kycVerificationId

  // Create session in PROCESSING state
  const session = await prisma.voiceSession.create({
    data: {
      userId: user.id,
      language,
      textSetIndex: 0,
      status: 'PROCESSING',
      kycVerified,
      validUntil,
    },
  })

  // Save audio files to temp directory
  const tempDir = path.join(os.tmpdir(), 'voxproof-jobs', session.id)
  fs.mkdirSync(tempDir, { recursive: true })
  for (let i = 0; i < files.length; i++) {
    fs.writeFileSync(path.join(tempDir, `audio${i + 1}.webm`), files[i].buffer)
  }

  // Enqueue job
  await sessionQueue.add('process', {
    sessionId: session.id,
    userId: user.id,
    tempDir,
    language,
    textSetName: resolvedSet.name,
    kycVerified,
    purchaseId: purchase?.id ?? null,
    validUntil: validUntil ? validUntil.toISOString() : null,
  })

  logActivity('SESSION_ANCHORED', {
    userId: req.userId,
    metadata: { sessionId: session.id, language, status: 'queued' },
    req,
  })

  return res.status(202).json({ sessionId: session.id, status: 'processing' })
}

export async function getSessionStatus(req: AuthRequest, res: Response) {
  const session = await prisma.voiceSession.findFirst({
    where: { id: req.params.id, userId: req.userId },
    select: {
      id: true,
      status: true,
      acousticHash: true,
      voiceHash: true,
      txHash: true,
      blockNumber: true,
      validUntil: true,
      anchoredAt: true,
      pdfBase64: true,
      spectrogramBase64: true,
      spectrogramMetrics: true,
      radarChartBase64: true,
      propertiesChartBase64: true,
      audioCids: true,
      audioUnpinAt: true,
    },
  })
  if (!session) return res.status(404).json({ error: 'Session not found' })

  if (session.status !== 'ANCHORED') {
    return res.json({ status: session.status, sessionId: session.id })
  }

  return res.json({
    status: 'ANCHORED',
    sessionId: session.id,
    acousticHash: session.acousticHash,
    voiceHash: session.voiceHash,
    txHash: session.txHash,
    blockNumber: session.blockNumber,
    validUntil: session.validUntil ? session.validUntil.toISOString() : null,
    radarChart: session.radarChartBase64,
    propertiesChart: session.propertiesChartBase64,
    spectrogram: session.spectrogramBase64,
    spectrogramMetrics: session.spectrogramMetrics,
    pdf: session.pdfBase64,
    audioCids: session.audioCids,
    audioUnpinAt: session.audioUnpinAt ? session.audioUnpinAt.toISOString() : null,
  })
}

export async function getSessions(req: AuthRequest, res: Response) {
  const sessions = await prisma.voiceSession.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(sessions)
}

export async function getSession(req: AuthRequest, res: Response) {
  const session = await prisma.voiceSession.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!session) return res.status(404).json({ error: 'Session not found' })
  return res.json(session)
}

export async function getSessionPdf(req: AuthRequest, res: Response) {
  const session = await prisma.voiceSession.findFirst({
    where: { id: req.params.id, userId: req.userId },
    select: { id: true, pdfBase64: true, anchoredAt: true },
  })
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (!session.pdfBase64) return res.status(404).json({ error: 'PDF not available for this session' })

  logActivity('PDF_DOWNLOADED', { userId: req.userId, metadata: { sessionId: session.id }, req })

  const buf = Buffer.from(session.pdfBase64, 'base64')
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="voxproof-${session.id.slice(0, 8)}.pdf"`)
  return res.send(buf)
}

export async function deleteSession(req: AuthRequest, res: Response) {
  const session = await prisma.voiceSession.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!session) return res.status(404).json({ error: 'Session not found' })
  await prisma.voiceSession.delete({ where: { id: session.id } })
  return res.status(204).send()
}

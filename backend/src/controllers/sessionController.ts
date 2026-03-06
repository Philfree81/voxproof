import { Response } from 'express'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { anchorHashOnChain } from '../services/blockchainService'
import { processSession } from '../services/processorService'
import { sendCertificateEmail } from '../services/emailService'
import { env } from '../config/env'

export async function createSession(req: AuthRequest, res: Response) {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length !== 5) {
    return res.status(400).json({ error: 'Exactly 5 audio files are required' })
  }

  const { language = 'fr', textSetIndex = '0' } = req.body
  const setIndex = parseInt(textSetIndex)
  if (![0, 1, 2, 3, 4].includes(setIndex)) {
    return res.status(400).json({ error: 'textSetIndex must be 0-4' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  // Find an unused purchase credit
  const purchase = await prisma.purchase.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  // Block if no available credit (skip check in development)
  if (env.nodeEnv !== 'development') {
    if (!purchase) {
      return res.status(402).json({ error: 'purchase_required', message: 'A purchase is required to create a session.' })
    }
  }

  // validUntil: null = lifetime, date = annual expiry; dev fallback = 1 year
  const validUntil = purchase
    ? purchase.validUntil   // null for lifetime, Date for annual
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  // Create session in PROCESSING state
  const session = await prisma.voiceSession.create({
    data: {
      userId: user.id,
      language,
      textSetIndex: setIndex,
      status: 'PROCESSING',
      kycVerified: user.kycStatus === 'APPROVED',
      validUntil,
    },
  })

  try {
    // Step 1 — anchor a placeholder hash to get tx details first
    // We use a two-step approach: process audio then anchor
    // For now: extract hash first (processor call without tx info), then anchor

    // First pass — get the acoustic hash
    const kycVerified = user.kycStatus === 'APPROVED'
    const preliminary = await processSession(
      files,
      { firstName: user.firstName, lastName: user.lastName, email: user.email },
      language,
      setIndex,
      'pending',
      0,
      validUntil,
      kycVerified,
    )

    // Step 2 — anchor acoustic hash on blockchain
    const { txHash, blockNumber } = await anchorHashOnChain(
      preliminary.acoustic_hash,
      session.id,
    )

    // Step 3 — generate final PDF with real tx info
    const final = await processSession(
      files,
      { firstName: user.firstName, lastName: user.lastName, email: user.email },
      language,
      setIndex,
      txHash,
      blockNumber,
      validUntil,
      kycVerified,
    )

    const anchoredAt = new Date()

    // Step 4 — update session + mark purchase as used
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: {
        status: 'ANCHORED',
        acousticHash: final.acoustic_hash,
        txHash,
        blockNumber,
        anchoredAt,
        pdfBase64: final.pdf,
        purchaseId: purchase?.id ?? null,
      },
    })

    if (purchase) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { usedAt: anchoredAt },
      })
    }

    // Step 5 — send certificate email (non-blocking: failure doesn't abort the response)
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    sendCertificateEmail({
      to: { email: user.email, name: fullName },
      sessionId: session.id,
      txHash,
      acousticHash: final.acoustic_hash,
      blockNumber,
      validUntil,
      pdfBase64: final.pdf,
      audioFiles: files,
    })
      .then(() =>
        prisma.voiceSession.update({
          where: { id: session.id },
          data: { emailSentAt: new Date() },
        })
      )
      .catch((err) => console.error('Failed to send certificate email:', err))

    return res.status(201).json({
      sessionId: session.id,
      acousticHash: final.acoustic_hash,
      txHash,
      blockNumber,
      validUntil: validUntil ? validUntil.toISOString() : null,
      radarChart: final.radar_chart,
      propertiesChart: final.properties_chart,
      pdf: final.pdf,
    })
  } catch (err: any) {
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: { status: 'FAILED' },
    })
    console.error('Session processing failed:', err)
    return res.status(500).json({ error: err.message || 'Processing failed' })
  }
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

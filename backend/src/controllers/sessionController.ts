import { Response } from 'express'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { anchorHashOnChain } from '../services/blockchainService'
import { processSession } from '../services/processorService'
import { sendCertificateEmail } from '../services/emailService'
import { uploadAudioToPinata } from '../services/pinataService'
import { env } from '../config/env'
import { logActivity } from '../services/activityService'

export async function createSession(req: AuthRequest, res: Response) {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length !== 5) {
    return res.status(400).json({ error: 'Exactly 5 audio files are required' })
  }

  const { language = 'fr', textSetId, withIdentityVerification } = req.body

  // Resolve text set: by ID (preferred) or fall back to first active set
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
  const textSetName = resolvedSet.name
  const setIndex = 0 // kept for schema compatibility

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
      kycVerified: withIdentityVerification === 'true' && !!user.kycVerificationId,
      validUntil,
    },
  })

  try {
    // Step 1 — anchor a placeholder hash to get tx details first
    // We use a two-step approach: process audio then anchor
    // For now: extract hash first (processor call without tx info), then anchor

    // First pass — get the acoustic hash
    const kycVerified = withIdentityVerification === 'true' && !!user.kycVerificationId
    const preliminary = await processSession(
      files,
      { firstName: user.firstName, lastName: user.lastName, email: user.email },
      language,
      setIndex,
      'pending',
      0,
      validUntil ?? undefined,
      kycVerified,
      textSetName,
    )

    // voiceHash is deterministic from audio — use from first pass
    const voiceHash = preliminary.voice_hash

    // Step 2 — anchor acoustic hash on blockchain
    const { txHash, blockNumber } = await anchorHashOnChain(
      preliminary.acoustic_hash,
      voiceHash,
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
      validUntil ?? undefined,
      kycVerified,
      textSetName,
    )

    const anchoredAt = new Date()

    // Step 4 — upload audio files to Pinata (non-blocking, best-effort)
    const audioCids: string[] = []
    if (env.pinataJwt) {
      try {
        for (let i = 0; i < files.length; i++) {
          const cid = await uploadAudioToPinata(
            files[i].buffer,
            files[i].originalname || `audio${i + 1}.webm`,
            session.id,
          )
          if (cid) audioCids.push(cid)
        }
        console.log(`[Pinata] Uploaded ${audioCids.length} audio(s) for session ${session.id.slice(0, 8)}`)
      } catch (err) {
        console.error('[Pinata] Upload failed (non-fatal):', err)
      }
    }

    const audioUnpinAt = audioCids.length > 0
      ? new Date(anchoredAt.getTime() + 5 * 24 * 60 * 60 * 1000)
      : null

    // Step 5 — update session + mark purchase as used
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: {
        status: 'ANCHORED',
        acousticHash: final.acoustic_hash,
        voiceHash,
        voiceCentroid: final.voice_centroid,
        txHash,
        blockNumber,
        anchoredAt,
        pdfBase64: final.pdf,
        spectrogramBase64: final.spectrogram,
        spectrogramMetrics: final.spectrogram_metrics as object,
        radarChartBase64: final.radar_chart,
        propertiesChartBase64: final.properties_chart,
        purchaseId: purchase?.id ?? null,
        audioCids,
        audioUnpinAt,
      },
    })

    if (purchase) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { usedAt: anchoredAt },
      })
    }

    // Step 6 — send certificate email (non-blocking: failure doesn't abort the response)
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    sendCertificateEmail({
      to: { email: user.email, name: fullName },
      sessionId: session.id,
      txHash,
      acousticHash: final.acoustic_hash,
      blockNumber,
      validUntil,
      pdfBase64: final.pdf,
    })
      .then(() =>
        prisma.voiceSession.update({
          where: { id: session.id },
          data: { emailSentAt: new Date() },
        })
      )
      .catch((err) => console.error('Failed to send certificate email:', err))

    logActivity('SESSION_ANCHORED', {
      userId: req.userId,
      metadata: { sessionId: session.id, txHash, language, acousticHash: final.acoustic_hash },
      req,
    })

    return res.status(201).json({
      sessionId: session.id,
      acousticHash: final.acoustic_hash,
      voiceHash,
      txHash,
      blockNumber,
      validUntil: validUntil ? validUntil.toISOString() : null,
      radarChart: final.radar_chart,
      propertiesChart: final.properties_chart,
      spectrogram: final.spectrogram,
      spectrogramMetrics: final.spectrogram_metrics,
      pdf: final.pdf,
      audioCids,
      audioUnpinAt: audioUnpinAt ? audioUnpinAt.toISOString() : null,
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

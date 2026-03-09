import { Worker, Job } from 'bullmq'
import fs from 'fs'
import path from 'path'
import { env } from '../config/env'
import { prisma } from '../config/database'
import { processSession } from './processorService'
import { anchorHashOnChain } from './blockchainService'
import { sendCertificateEmail } from './emailService'
import { uploadAudioToPinata } from './pinataService'
import { logActivity } from './activityService'
import { SessionJobData } from './sessionQueue'

async function processJob(job: Job<SessionJobData>) {
  const { sessionId, userId, tempDir, language, kycVerified, textSetName, purchaseId, validUntil: validUntilStr } = job.data
  const validUntil = validUntilStr ? new Date(validUntilStr) : null
  const setIndex = 0

  // Read audio files from temp dir
  const audioFiles: Express.Multer.File[] = []
  for (let i = 1; i <= 5; i++) {
    const filePath = path.join(tempDir, `audio${i}.webm`)
    const buffer = fs.readFileSync(filePath)
    audioFiles.push({
      buffer,
      originalname: `audio${i}.webm`,
      mimetype: 'audio/webm',
      fieldname: `audio${i}`,
      encoding: '7bit',
      size: buffer.length,
    } as Express.Multer.File)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  // First pass — get hashes
  const preliminary = await processSession(
    audioFiles,
    { firstName: user.firstName, lastName: user.lastName, email: user.email },
    language, setIndex, 'pending', 0, validUntil ?? undefined, kycVerified, textSetName,
  )

  // Anchor on blockchain
  const { txHash, blockNumber } = await anchorHashOnChain(
    preliminary.acoustic_hash,
    preliminary.voice_hash,
    sessionId,
  )

  // Second pass — generate final PDF with real tx info
  const final = await processSession(
    audioFiles,
    { firstName: user.firstName, lastName: user.lastName, email: user.email },
    language, setIndex, txHash, blockNumber, validUntil ?? undefined, kycVerified, textSetName,
  )

  const anchoredAt = new Date()

  // Upload to Pinata (non-blocking best-effort)
  const audioCids: string[] = []
  if (env.pinataJwt) {
    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const cid = await uploadAudioToPinata(audioFiles[i].buffer, audioFiles[i].originalname, sessionId)
        if (cid) audioCids.push(cid)
      }
    } catch (err) {
      console.error('[Pinata] Upload failed (non-fatal):', err)
    }
  }

  const audioUnpinAt = audioCids.length > 0
    ? new Date(anchoredAt.getTime() + 5 * 24 * 60 * 60 * 1000)
    : null

  // Update session in DB
  await prisma.voiceSession.update({
    where: { id: sessionId },
    data: {
      status: 'ANCHORED',
      acousticHash: final.acoustic_hash,
      voiceHash: preliminary.voice_hash,
      voiceCentroid: final.voice_centroid,
      txHash,
      blockNumber,
      anchoredAt,
      pdfBase64: final.pdf,
      spectrogramBase64: final.spectrogram,
      spectrogramMetrics: final.spectrogram_metrics as object,
      radarChartBase64: final.radar_chart,
      propertiesChartBase64: final.properties_chart,
      purchaseId: purchaseId ?? null,
      audioCids,
      audioUnpinAt,
    },
  })

  // Mark purchase as used
  if (purchaseId) {
    await prisma.purchase.update({ where: { id: purchaseId }, data: { usedAt: anchoredAt } })
  }

  // Send certificate email (non-blocking)
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  sendCertificateEmail({
    to: { email: user.email, name: fullName },
    sessionId,
    txHash,
    acousticHash: final.acoustic_hash,
    blockNumber,
    validUntil,
    pdfBase64: final.pdf,
  })
    .then(() => prisma.voiceSession.update({ where: { id: sessionId }, data: { emailSentAt: new Date() } }))
    .catch(err => console.error('Failed to send certificate email:', err))

  logActivity('SESSION_ANCHORED', {
    userId,
    metadata: { sessionId, txHash, language, acousticHash: final.acoustic_hash },
  })

  // Clean up temp files
  try { fs.rmSync(tempDir, { recursive: true }) } catch {}

  console.log(`[Worker] Session ${sessionId.slice(0, 8)} anchored — tx: ${txHash.slice(0, 12)}...`)
}

export function startSessionWorker() {
  const worker = new Worker<SessionJobData>(
    'session-processing',
    processJob,
    {
      connection: { host: env.redisHost, port: env.redisPort },
      concurrency: 4,
    },
  )

  worker.on('completed', job =>
    console.log(`[Worker] Job ${job.id} completed — session ${job.data.sessionId.slice(0, 8)}`),
  )

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message)
    if (job?.data.sessionId) {
      await prisma.voiceSession.update({
        where: { id: job.data.sessionId },
        data: { status: 'FAILED' },
      }).catch(() => {})
    }
    if (job?.data.tempDir) {
      try { fs.rmSync(job.data.tempDir, { recursive: true }) } catch {}
    }
  })

  console.log('[Worker] Session processing worker started (concurrency: 4)')
  return worker
}

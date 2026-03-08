import { prisma } from '../config/database'
import { unpinFromPinata } from './pinataService'

/**
 * Runs every hour. Unpins audio files from Pinata for sessions
 * where audioUnpinAt has passed, then clears the CIDs from DB.
 */
export function startUnpinScheduler(): void {
  const INTERVAL_MS = 60 * 60 * 1000 // 1 hour

  async function runUnpin() {
    try {
      const sessions = await prisma.voiceSession.findMany({
        where: {
          audioUnpinAt: { lte: new Date() },
          audioCids: { isEmpty: false },
        },
        select: { id: true, audioCids: true },
      })

      if (sessions.length === 0) return

      console.log(`[UnpinScheduler] ${sessions.length} session(s) to unpin`)

      for (const session of sessions) {
        for (const cid of session.audioCids) {
          await unpinFromPinata(cid)
        }
        await prisma.voiceSession.update({
          where: { id: session.id },
          data: { audioCids: [], audioUnpinAt: null },
        })
        console.log(`[UnpinScheduler] Session ${session.id.slice(0, 8)} — audios supprimés`)
      }
    } catch (err) {
      console.error('[UnpinScheduler] Error:', err)
    }
  }

  // Run immediately on startup, then every hour
  runUnpin()
  setInterval(runUnpin, INTERVAL_MS)
  console.log('[UnpinScheduler] Started (interval: 1h)')
}

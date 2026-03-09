import { Queue } from 'bullmq'
import { env } from '../config/env'

export interface SessionJobData {
  sessionId: string
  userId: string
  tempDir: string
  language: string
  textSetName: string
  kycVerified: boolean
  purchaseId: string | null
  validUntil: string | null
}

export const sessionQueue = new Queue<SessionJobData>('session-processing', {
  connection: { host: env.redisHost, port: env.redisPort },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
})

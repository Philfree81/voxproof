/**
 * Structured activity logger.
 * Non-blocking — never throws, never crashes the app.
 */
import { prisma } from '../config/database'
import { Request } from 'express'

export type ActivityAction =
  | 'REGISTER'
  | 'REGISTER_FAILED'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'PURCHASE'
  | 'PAYMENT_FAILED'
  | 'SESSION_ANCHORED'
  | 'PDF_DOWNLOADED'
  | 'TEXTS_DOWNLOADED'

export async function logActivity(
  action: ActivityAction,
  options: {
    userId?: string
    metadata?: Record<string, unknown>
    req?: Request
  } = {},
) {
  try {
    const ip = options.req
      ? (options.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || options.req.socket.remoteAddress
        || null
      : null

    const userAgent = options.req
      ? (options.req.headers['user-agent'] ?? null)
      : null

    await prisma.activityLog.create({
      data: {
        userId: options.userId ?? null,
        action,
        metadata: (options.metadata ?? {}) as object,
        ip,
        userAgent,
      },
    })
  } catch (err) {
    console.error('[ActivityLog] Failed to write log:', err)
  }
}

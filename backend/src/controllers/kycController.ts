import { Response } from 'express'
import { prisma } from '../config/database'
import { createIdentityVerificationSession, getIdentityVerificationSession } from '../services/stripeService'
import { AuthRequest } from '../middleware/auth'
import { env } from '../config/env'

export async function startKyc(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.kycVerificationId) {
    return res.status(200).json({ message: 'Already verified', kycStatus: 'APPROVED' })
  }

  const returnUrl = `${env.frontendUrl}/dashboard?kyc=complete`
  const { sessionId, url } = await createIdentityVerificationSession(req.userId!, returnUrl)

  await prisma.user.update({
    where: { id: req.userId },
    data: { kycVerificationId: sessionId, kycStatus: 'PENDING' },
  })

  return res.json({ url, sessionId })
}

export async function devApproveKyc(req: AuthRequest, res: Response) {
  if (env.nodeEnv === 'production') {
    return res.status(403).json({ error: 'Not available in production' })
  }
  await prisma.user.update({
    where: { id: req.userId },
    data: { kycStatus: 'APPROVED', kycVerifiedAt: new Date() },
  })
  return res.json({ kycStatus: 'APPROVED' })
}

export async function getKycStatus(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { kycStatus: true, kycVerifiedAt: true, kycVerificationId: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })

  if (user.kycVerificationId && user.kycStatus === 'PENDING') {
    const session = await getIdentityVerificationSession(user.kycVerificationId)
    if (session.status === 'verified') {
      await prisma.user.update({
        where: { id: req.userId },
        data: { kycStatus: 'APPROVED', kycVerifiedAt: new Date() },
      })
      return res.json({ kycStatus: 'APPROVED', kycVerifiedAt: new Date() })
    }
    if (session.status === 'requires_input') {
      await prisma.user.update({
        where: { id: req.userId },
        data: { kycStatus: 'REJECTED' },
      })
      return res.json({ kycStatus: 'REJECTED' })
    }
  }

  return res.json({ kycStatus: user.kycStatus, kycVerifiedAt: user.kycVerifiedAt })
}

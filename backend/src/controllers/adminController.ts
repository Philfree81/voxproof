import { Response } from 'express'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      kycStatus: true,
      isAdmin: true,
      createdAt: true,
      purchases: {
        select: { id: true, productType: true, usedAt: true, validUntil: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      sessions: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return res.json(users)
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { email, kycStatus, isAdmin } = req.body

  const data: Record<string, unknown> = {}
  if (email !== undefined) data.email = email
  if (kycStatus !== undefined) data.kycStatus = kycStatus
  if (isAdmin !== undefined) data.isAdmin = isAdmin

  const user = await prisma.user.update({ where: { id }, data,
    select: { id: true, email: true, kycStatus: true, isAdmin: true },
  })
  return res.json(user)
}

export async function deleteUser(req: AuthRequest, res: Response) {
  await prisma.user.delete({ where: { id: req.params.id } })
  return res.status(204).send()
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export async function addCredit(req: AuthRequest, res: Response) {
  const { id: userId } = req.params
  const { productType } = req.body // 'ANNUAL' | 'LIFETIME'

  if (!['ANNUAL', 'LIFETIME'].includes(productType)) {
    return res.status(400).json({ error: 'productType must be ANNUAL or LIFETIME' })
  }

  const validUntil = productType === 'ANNUAL'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    : null

  const purchase = await prisma.purchase.create({
    data: {
      userId,
      stripePriceId: 'manual',
      productType,
      validUntil,
    },
  })
  return res.status(201).json(purchase)
}

export async function deleteCredit(req: AuthRequest, res: Response) {
  await prisma.purchase.delete({ where: { id: req.params.id } })
  return res.status(204).send()
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function listSessions(_req: AuthRequest, res: Response) {
  const sessions = await prisma.voiceSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      status: true,
      language: true,
      txHash: true,
      blockNumber: true,
      anchoredAt: true,
      validUntil: true,
      emailSentAt: true,
      createdAt: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })
  return res.json(sessions)
}

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../config/database'
import { env } from '../config/env'
import { createCustomer } from '../services/stripeService'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService'
import { notifyNewUser, notifyLogin } from '../services/notifyService'
import { logActivity } from '../services/activityService'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const { email, password, firstName, lastName } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    logActivity('REGISTER_FAILED', { metadata: { email, reason: 'email_already_registered' }, req })
    return res.status(409).json({ error: 'Email already registered' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const stripeCustomerId = await createCustomer(email, [firstName, lastName].filter(Boolean).join(' '))

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      stripeCustomerId,
    },
    select: { id: true, email: true, firstName: true, lastName: true, kycStatus: true },
  })

  const token = signToken(user.id)

  // Send welcome email (non-blocking)
  sendWelcomeEmail({
    email: user.email,
    name: [firstName, lastName].filter(Boolean).join(' ') || user.email,
  }).catch((err) => console.error('Welcome email error:', err))

  notifyNewUser(user.email, firstName, lastName).catch(() => {})
  logActivity('REGISTER', { userId: user.id, metadata: { email: user.email }, req })

  return res.status(201).json({ token, user })
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    logActivity('LOGIN_FAILED', { metadata: { email, reason: 'user_not_found' }, req })
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    logActivity('LOGIN_FAILED', { userId: user.id, metadata: { email, reason: 'wrong_password' }, req })
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken(user.id)

  notifyLogin(user.email, user.firstName, user.lastName).catch(() => {})
  logActivity('LOGIN', { userId: user.id, metadata: { email: user.email }, req })

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      kycStatus: user.kycStatus,
    },
  })
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  const user = await prisma.user.findUnique({ where: { email } })
  // Always respond OK to avoid email enumeration
  if (!user) return res.json({ message: 'Si ce compte existe, un email a été envoyé.' })

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  })

  const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`
  await sendPasswordResetEmail({
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
  }, resetUrl)

  return res.json({ message: 'Si ce compte existe, un email a été envoyé.' })
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  })
  if (!user) return res.status(400).json({ error: 'Token invalide ou expiré' })

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
  })

  return res.json({ message: 'Mot de passe réinitialisé avec succès' })
}

export async function getMe(req: Request & { userId?: string }, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      kycStatus: true, emailVerified: true,
      createdAt: true, purchases: true,
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.json(user)
}


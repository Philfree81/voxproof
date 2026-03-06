import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { stripe, createCheckoutSession } from '../services/stripeService'
import { AuthRequest } from '../middleware/auth'
import { env } from '../config/env'

export async function createPurchase(req: AuthRequest, res: Response) {
  const { priceId } = req.body
  const validPrices = [env.stripePriceAnnual, env.stripePriceLifetime].filter(Boolean)

  if (!priceId || !validPrices.includes(priceId)) {
    return res.status(400).json({ error: 'Invalid price ID' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (!user.stripeCustomerId) return res.status(400).json({ error: 'No Stripe customer on file' })

  const mode = priceId === env.stripePriceLifetime ? 'payment' : 'subscription'

  const url = await createCheckoutSession(
    user.stripeCustomerId,
    priceId,
    req.userId!,
    `${env.frontendUrl}/session?payment=success`,
    `${env.frontendUrl}/session?payment=canceled`,
    mode,
  )

  return res.json({ url })
}

export async function getPurchaseStatus(req: AuthRequest, res: Response) {
  const purchase = await prisma.purchase.findFirst({
    where: { userId: req.userId, usedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { productType: true, validUntil: true, createdAt: true },
  })

  return res.json({
    hasCredit: !!purchase,
    purchase: purchase ?? null,
  })
}

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret)
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata?.userId
    const priceId = session.metadata?.priceId

    console.log('[Webhook] checkout.session.completed', {
      userId,
      priceId,
      payment_status: session.payment_status,
      mode: session.mode,
      sessionId: session.id,
    })

    // payment_status === 'paid' pour one-time ; pour subscription, accepter aussi 'unpaid'
    // car le paiement est confirmé via invoice séparément
    const isPaid = session.payment_status === 'paid' || session.mode === 'subscription'

    if (userId && isPaid) {
      const isLifetime = priceId === env.stripePriceLifetime
      const validUntil = isLifetime
        ? null
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

      await prisma.purchase.create({
        data: {
          userId,
          stripePaymentIntentId: session.payment_intent ?? null,
          stripePriceId: priceId,
          productType: isLifetime ? 'LIFETIME' : 'ANNUAL',
          validUntil,
        },
      })
      console.log('[Webhook] Purchase créé pour userId', userId)
    } else {
      console.warn('[Webhook] Ignoré — userId:', userId, 'isPaid:', isPaid)
    }
  }

  return res.json({ received: true })
}

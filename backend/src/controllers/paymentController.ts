import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { stripe, createCheckoutSession, cancelSubscription } from '../services/stripeService'
import { AuthRequest } from '../middleware/auth'
import { env } from '../config/env'

const PRICE_MAP: Record<string, string> = {
  starter: env.stripePriceStarter,
  pro: env.stripePricePro,
}

export async function createSubscription(req: AuthRequest, res: Response) {
  const { plan } = req.body
  if (!plan || !PRICE_MAP[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Choose: starter, pro' })
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } })
  if (!subscription) return res.status(404).json({ error: 'Subscription record not found' })

  const url = await createCheckoutSession(
    subscription.stripeCustomerId,
    PRICE_MAP[plan],
    req.userId!,
    `${env.frontendUrl}/dashboard?payment=success`,
    `${env.frontendUrl}/pricing?payment=canceled`
  )

  return res.json({ url })
}

export async function cancelPlan(req: AuthRequest, res: Response) {
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } })
  if (!subscription?.stripeSubscriptionId) {
    return res.status(400).json({ error: 'No active subscription' })
  }

  await cancelSubscription(subscription.stripeSubscriptionId)
  await prisma.subscription.update({
    where: { userId: req.userId },
    data: { cancelAtPeriodEnd: true },
  })

  return res.json({ message: 'Subscription will be canceled at end of billing period' })
}

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret)
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = session.metadata?.userId
      if (userId && session.subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription)
        const priceId = stripeSubscription.items.data[0]?.price.id
        const plan = priceId === env.stripePriceStarter ? 'STARTER' : 'PRO'
        await prisma.subscription.update({
          where: { userId },
          data: {
            stripeSubscriptionId: session.subscription,
            plan,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'CANCELED' },
      })
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as any
      await prisma.subscription.updateMany({
        where: { stripeCustomerId: invoice.customer },
        data: { status: 'PAST_DUE' },
      })
      break
    }
  }

  return res.json({ received: true })
}

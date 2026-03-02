import { Request, Response } from 'express'
import { prisma } from '../config/database'
import { stripe, createCheckoutSession, cancelSubscription } from '../services/stripeService'
import { AuthRequest } from '../middleware/auth'
import { env } from '../config/env'

export async function createSubscription(req: AuthRequest, res: Response) {
  const subscription = await prisma.subscription.findFirst({ where: { userId: req.userId } })
  if (!subscription) return res.status(404).json({ error: 'Subscription record not found' })

  if (subscription.status === 'ACTIVE' && subscription.stripeSubscriptionId) {
    return res.status(400).json({ error: 'You already have an active subscription' })
  }

  const url = await createCheckoutSession(
    subscription.stripeCustomerId,
    env.stripePriceAnnual,
    req.userId!,
    `${env.frontendUrl}/dashboard?payment=success`,
    `${env.frontendUrl}/dashboard?payment=canceled`,
  )

  return res.json({ url })
}

export async function getSubscriptionStatus(req: AuthRequest, res: Response) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true, stripeSubscriptionId: true },
  })
  if (!subscription) return res.status(404).json({ error: 'Not found' })
  return res.json(subscription)
}

export async function cancelPlan(req: AuthRequest, res: Response) {
  const subscription = await prisma.subscription.findFirst({ where: { userId: req.userId } })
  if (!subscription?.stripeSubscriptionId) {
    return res.status(400).json({ error: 'No active subscription' })
  }

  await cancelSubscription(subscription.stripeSubscriptionId)
  await prisma.subscription.updateMany({
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
        const stripeSub = await stripe.subscriptions.retrieve(session.subscription)
        await prisma.subscription.updateMany({
          where: { userId },
          data: {
            stripeSubscriptionId: session.subscription,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
            cancelAtPeriodEnd: false,
          },
        })
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any
      if (invoice.subscription) {
        const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription) as any
        const userId = stripeSub.metadata?.userId
        const newPeriodEnd = new Date(stripeSub.current_period_end * 1000)

        if (userId) {
          await prisma.subscription.updateMany({
            where: { userId },
            data: { stripeSubscriptionId: invoice.subscription, status: 'ACTIVE', currentPeriodEnd: newPeriodEnd },
          })
          // Extend all ANCHORED certifications (renewal = automatic prolongation)
          await prisma.voiceSession.updateMany({
            where: { userId, status: 'ANCHORED' },
            data: { validUntil: newPeriodEnd },
          })
        } else {
          // Renewal: stripeSubscriptionId is already set, find userId from our DB
          const sub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription },
            select: { userId: true },
          })
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription },
            data: { status: 'ACTIVE', currentPeriodEnd: newPeriodEnd },
          })
          if (sub?.userId) {
            await prisma.voiceSession.updateMany({
              where: { userId: sub.userId, status: 'ANCHORED' },
              data: { validUntil: newPeriodEnd },
            })
          }
        }
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

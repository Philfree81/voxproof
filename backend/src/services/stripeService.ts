import Stripe from 'stripe'
import { env } from '../config/env'

export const stripe = new Stripe(env.stripeSecretKey, { apiVersion: '2023-10-16' })

export async function createCustomer(email: string, name?: string): Promise<string> {
  const customer = await stripe.customers.create({ email, name })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  return session.url!
}

export async function createIdentityVerificationSession(
  userId: string,
  returnUrl: string
): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { userId },
    options: {
      document: {
        require_id_number: true,
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
    return_url: returnUrl,
  })
  return { sessionId: session.id, url: session.url! }
}

export async function getIdentityVerificationSession(sessionId: string) {
  return stripe.identity.verificationSessions.retrieve(sessionId)
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
}

/**
 * WhatsApp notifications via Twilio sandbox.
 * Non-blocking — failures are logged but never crash the app.
 */
import { env } from '../config/env'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Twilio = require('twilio')

function getClient() {
  if (!env.twilioAccountSid || !env.twilioAuthToken) return null
  return Twilio(env.twilioAccountSid, env.twilioAuthToken)
}

async function send(body: string) {
  const client = getClient()
  if (!client || !env.twilioWhatsappFrom || !env.notifyWhatsappTo) return
  try {
    await client.messages.create({
      from: env.twilioWhatsappFrom,
      to: env.notifyWhatsappTo,
      body,
    })
  } catch (err) {
    console.error('[Notify] WhatsApp send failed:', err)
  }
}

export async function notifyNewUser(email: string, firstName?: string, lastName?: string) {
  const name = [firstName, lastName].filter(Boolean).join(' ') || email
  await send(`VoxProof - Nouvelle inscription\nNom : ${name}\nEmail : ${email}`)
}

export async function notifyNewPurchase(email: string, productType: string, amount?: string) {
  const label = productType === 'LIFETIME' ? 'A vie' : '1 an'
  const price = amount ? ` - ${amount}` : ''
  await send(`VoxProof - Nouvel achat\nEmail : ${email}\nFormule : ${label}${price}`)
}

export async function notifyLogin(email: string, firstName?: string | null, lastName?: string | null) {
  const name = [firstName, lastName].filter(Boolean).join(' ') || email
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
  await send(`VoxProof - Connexion\nNom : ${name}\nEmail : ${email}\nHeure : ${now}`)
}

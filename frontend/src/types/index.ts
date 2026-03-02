export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SessionStatus = 'RECORDING' | 'PROCESSING' | 'ANCHORED' | 'FAILED'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE'
export type Language = 'fr' | 'en' | 'es'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  kycStatus: KycStatus
  emailVerified: boolean
  createdAt: string
  subscriptions?: Subscription[]
}

export interface VoiceSession {
  id: string
  userId: string
  language: Language
  textSetIndex: number
  status: SessionStatus
  acousticHash?: string
  txHash?: string
  blockNumber?: number
  anchoredAt?: string
  validUntil?: string
  emailSentAt?: string
  createdAt: string
  subscription?: Subscription
}

export interface Subscription {
  id: string
  status: SubscriptionStatus
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
}

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SessionStatus = 'RECORDING' | 'PROCESSING' | 'ANCHORED' | 'FAILED'
export type ProductType = 'ANNUAL' | 'LIFETIME'
export type Language = 'fr' | 'en' | 'es'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  kycStatus: KycStatus
  isAdmin: boolean
  emailVerified: boolean
  createdAt: string
}

export interface Purchase {
  id: string
  productType: ProductType
  usedAt?: string | null
  validUntil?: string | null
  createdAt: string
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
  validUntil?: string | null
  kycVerified: boolean
  emailSentAt?: string
  createdAt: string
}

export interface AdminUser extends User {
  purchases: Purchase[]
  sessions: { id: string; status: SessionStatus; createdAt: string }[]
}

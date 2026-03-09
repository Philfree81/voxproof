export interface SpectrogramMetrics {
  centroide_hz: number
  rolloff_hz: number
  energie_grave_pct: number
  energie_medium_pct: number
  energie_aigu_pct: number
  variabilite: number
}

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
  kycVerificationId?: string | null
  isAdmin: boolean
  emailVerified: boolean
  theme?: string
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
  voiceHash?: string
  txHash?: string
  blockNumber?: number
  anchoredAt?: string
  validUntil?: string | null
  kycVerified: boolean
  emailSentAt?: string
  audioCids?: string[]
  audioUnpinAt?: string | null
  radarChartBase64?: string
  propertiesChartBase64?: string
  spectrogramBase64?: string
  spectrogramMetrics?: SpectrogramMetrics | null
  createdAt: string
}

export interface AdminUser extends User {
  theme?: string
  purchases: Purchase[]
  sessions: { id: string; status: SessionStatus; createdAt: string }[]
}

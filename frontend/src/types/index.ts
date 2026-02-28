export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SubscriptionPlan = 'STARTER' | 'PRO' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  walletAddress?: string
  kycStatus: KycStatus
  emailVerified: boolean
  createdAt: string
  subscription?: Subscription
}

export interface VoiceRecord {
  id: string
  userId: string
  title: string
  description?: string
  ipfsCid: string
  audioHash: string
  fileSizeBytes: number
  durationSeconds?: number
  mimeType: string
  createdAt: string
  proof?: Proof
  ipfsUrl?: string
}

export interface Proof {
  id: string
  recordId: string
  txHash: string
  contractProofId: number
  blockNumber: number
  chainId: number
  network: string
  anchoredAt: string
  revoked: boolean
  revokedAt?: string
}

export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

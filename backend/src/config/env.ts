import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Active blockchain — set BLOCKCHAIN_RPC_URL to switch network:
  //   local:   http://127.0.0.1:8545
  //   fuji:    https://api.avax-test.network/ext/bc/C/rpc
  //   mainnet: https://api.avax.network/ext/bc/C/rpc
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
  contractAddress: required('VOXPROOF_CONTRACT_ADDRESS'),
  deployerPrivateKey: required('DEPLOYER_PRIVATE_KEY'),

  stripeSecretKey: required('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  stripePriceAnnual: process.env.STRIPE_PRICE_ANNUAL || '',
  stripePriceLifetime: process.env.STRIPE_PRICE_LIFETIME || '',

  processorUrl: process.env.PROCESSOR_URL || 'http://localhost:5000',

  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@voxproof.io',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'VoxProof',
}

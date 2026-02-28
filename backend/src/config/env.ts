import dotenv from 'dotenv'
dotenv.config()

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

  pinataApiKey: required('PINATA_API_KEY'),
  pinataSecretApiKey: required('PINATA_SECRET_API_KEY'),

  avalancheRpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
  avalancheTestnetRpcUrl: process.env.AVALANCHE_TESTNET_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  contractAddress: required('VOXPROOF_CONTRACT_ADDRESS'),
  deployerPrivateKey: required('DEPLOYER_PRIVATE_KEY'),

  stripeSecretKey: required('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  stripePriceStarter: required('STRIPE_PRICE_STARTER'),
  stripePricePro: required('STRIPE_PRICE_PRO'),
}

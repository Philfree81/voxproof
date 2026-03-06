import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import authRoutes from './routes/auth'
import kycRoutes from './routes/kyc'
import paymentRoutes from './routes/payments'
import sessionRoutes from './routes/sessions'
import adminRoutes from './routes/admin'

const app = express()

// ─── Security ───────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

// ─── Rate limiting ──────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use(limiter)

// ─── Stripe webhook (raw body before json parse) ────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

// ─── Body parsing ───────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/admin', adminRoutes)

// ─── Health check ───────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── 404 ────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// ─── Error handler ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: env.nodeEnv === 'production' ? 'Internal server error' : err.message })
})

app.listen(env.port, () => {
  console.log(`VoxProof API running on port ${env.port} [${env.nodeEnv}]`)
})

export default app

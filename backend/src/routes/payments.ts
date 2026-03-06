import { Router } from 'express'
import { createPurchase, getPurchaseStatus, stripeWebhook } from '../controllers/paymentController'
import { requireAuth } from '../middleware/auth'
import express from 'express'

const router = Router()

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

router.use(requireAuth)
router.get('/status', getPurchaseStatus)
router.post('/purchase', createPurchase)

export default router

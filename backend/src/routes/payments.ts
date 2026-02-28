import { Router } from 'express'
import { createSubscription, cancelPlan, stripeWebhook } from '../controllers/paymentController'
import { requireAuth } from '../middleware/auth'
import express from 'express'

const router = Router()

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

router.use(requireAuth)
router.post('/subscribe', createSubscription)
router.post('/cancel', cancelPlan)

export default router

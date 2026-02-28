import { Router } from 'express'
import { startKyc, getKycStatus } from '../controllers/kycController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/start', startKyc)
router.get('/status', getKycStatus)

export default router

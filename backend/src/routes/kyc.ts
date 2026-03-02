import { Router } from 'express'
import { startKyc, getKycStatus, devApproveKyc } from '../controllers/kycController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)
router.post('/start', startKyc)
router.get('/status', getKycStatus)
router.post('/dev-approve', devApproveKyc)

export default router

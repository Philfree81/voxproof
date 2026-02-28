import { Router } from 'express'
import { anchorProof, getProof, verifyProof } from '../controllers/proofController'
import { requireAuth, requireKyc } from '../middleware/auth'

const router = Router()

router.get('/verify/:hash', verifyProof)

router.use(requireAuth, requireKyc)
router.post('/records/:recordId/anchor', anchorProof)
router.get('/:id', getProof)

export default router

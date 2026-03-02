import { Router } from 'express'
import { createSession, getSessions, getSession, getSessionPdf, deleteSession } from '../controllers/sessionController'
import { requireAuth, requireKyc } from '../middleware/auth'
import { uploadAudio } from '../middleware/upload'

const router = Router()

router.use(requireAuth, requireKyc)

router.get('/', getSessions)
router.get('/:id/pdf', getSessionPdf)
router.get('/:id', getSession)
router.post('/', uploadAudio.array('audio', 5), createSession)
router.delete('/:id', deleteSession)

export default router

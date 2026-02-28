import { Router } from 'express'
import { uploadRecord, getRecords, getRecord, deleteRecord } from '../controllers/recordController'
import { requireAuth, requireKyc } from '../middleware/auth'
import { uploadAudio } from '../middleware/upload'

const router = Router()

router.use(requireAuth, requireKyc)

router.get('/', getRecords)
router.post('/', uploadAudio.single('audio'), uploadRecord)
router.get('/:id', getRecord)
router.delete('/:id', deleteRecord)

export default router

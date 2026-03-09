import { Router } from 'express'
import { createSession, getSessions, getSession, getSessionStatus, getSessionPdf, deleteSession } from '../controllers/sessionController'
import { requireAuth } from '../middleware/auth'
import { uploadAudio } from '../middleware/upload'
import { prisma } from '../config/database'

const router = Router()

// Public: return active text sets + selection mode (no auth needed)
router.get('/text-sets', async (_req, res) => {
  const sets = await prisma.textSet.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, theme: true, isDefault: true, texts: true },
  })
  const config = await prisma.appConfig.findUnique({ where: { key: 'text_selection_mode' } })
  return res.json({ sets, mode: config?.value ?? 'default' })
})

router.use(requireAuth)

router.get('/', getSessions)
router.get('/:id/pdf', getSessionPdf)
router.get('/:id/status', getSessionStatus)
router.post('/:id/log-texts-download', async (req: any, res) => {
  const { logActivity } = await import('../services/activityService')
  logActivity('TEXTS_DOWNLOADED', { userId: req.userId, metadata: { sessionId: req.params.id }, req })
  return res.status(204).send()
})
router.get('/:id', getSession)
router.post('/', uploadAudio.array('audio', 5), createSession)
router.delete('/:id', deleteSession)

export default router

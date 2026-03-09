import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'
import {
  getConfig, setConfig,
  listUsers, updateUser, deleteUser,
  addCredit, deleteCredit,
  listSessions, compareSessions, verifyAudioDestruction,
  listTextSets, createTextSet, updateTextSet, deleteTextSet,
  generateTextSet, setTextSelectionMode,
  listActivityLogs,
} from '../controllers/adminController'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/config', getConfig)
router.put('/config', setConfig)

router.get('/users', listUsers)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.post('/users/:id/credit', addCredit)
router.delete('/purchases/:id', deleteCredit)
router.get('/sessions', listSessions)
router.post('/sessions/compare', compareSessions)
router.post('/sessions/:id/verify-audio', verifyAudioDestruction)

router.get('/text-sets', listTextSets)
router.post('/text-sets', createTextSet)
router.post('/text-sets/generate', generateTextSet)
router.patch('/text-sets/:id', updateTextSet)
router.delete('/text-sets/:id', deleteTextSet)
router.post('/text-sets/mode', setTextSelectionMode)

router.get('/activity', listActivityLogs)

export default router

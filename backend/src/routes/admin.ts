import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'
import {
  listUsers, updateUser, deleteUser,
  addCredit, deleteCredit,
  listSessions,
  listTextSets, createTextSet, updateTextSet, deleteTextSet,
  generateTextSet, setTextSelectionMode,
  listActivityLogs,
} from '../controllers/adminController'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/users', listUsers)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.post('/users/:id/credit', addCredit)
router.delete('/purchases/:id', deleteCredit)
router.get('/sessions', listSessions)

router.get('/text-sets', listTextSets)
router.post('/text-sets', createTextSet)
router.post('/text-sets/generate', generateTextSet)
router.patch('/text-sets/:id', updateTextSet)
router.delete('/text-sets/:id', deleteTextSet)
router.post('/text-sets/mode', setTextSelectionMode)

router.get('/activity', listActivityLogs)

export default router

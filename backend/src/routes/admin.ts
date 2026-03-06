import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'
import {
  listUsers, updateUser, deleteUser,
  addCredit, deleteCredit,
  listSessions,
} from '../controllers/adminController'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/users', listUsers)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.post('/users/:id/credit', addCredit)
router.delete('/purchases/:id', deleteCredit)
router.get('/sessions', listSessions)

export default router

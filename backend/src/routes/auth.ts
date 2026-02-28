import { Router } from 'express'
import { register, login, getMe, connectWallet } from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, getMe)
router.patch('/me/wallet', requireAuth, connectWallet)

export default router

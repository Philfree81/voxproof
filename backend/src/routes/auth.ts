import { Router } from 'express'
import { register, login, getMe, forgotPassword, resetPassword, updateTheme } from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, getMe)
router.patch('/me/theme', requireAuth, updateTheme)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router

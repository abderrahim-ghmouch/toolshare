import {
    Router
} from 'express'
import {
    getProfile,
    updateProfile,
    changePassword
} from '../controllers/profileController.js'
import {
    authMiddleware
} from '../middlewares/authMiddleware.js'

const router = Router()

// any logged-in user (admin, manager or user) manages his OWN account: the id comes from the token
router.use('/api/me', authMiddleware)

router.get('/api/me', getProfile)
router.patch('/api/me', updateProfile)
router.patch('/api/me/password', changePassword)

export default router
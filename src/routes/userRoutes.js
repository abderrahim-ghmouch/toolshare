import { Router } from 'express'
import { createUser, listUsers } from '../controllers/userController.js'




const router = Router()


router.get('/api/users',authMiddleware,authorize('admin'),listUsers)

router.post('/api/users',authMiddleware,authorize('admin'),createUser)

export default router

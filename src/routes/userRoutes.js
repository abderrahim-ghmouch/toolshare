import { Router } from 'express'
import { createUser, listUsers } from '../controllers/userController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { authorize } from '../middlewares/roleMiddelware.js'


const router = Router()


router.get('/api/users',authMiddleware,authorize('admin'),listUsers)

router.post('/api/users',authMiddleware,authorize('admin'),createUser)

export default router

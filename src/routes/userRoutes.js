import { Router } from 'express'
import { createUser, listUsers } from '../controllers/userController.js'




const router = Router()
router.get('/api/users', listUsers)

router.post('/api/users', createUser)

export default router

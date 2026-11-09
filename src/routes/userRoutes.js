import { Router } from 'express'

import userController from '../controllers/userController.js'

const router = Router()

router.get('/api/users/me/loans', userController.getMyLoans)

export default router

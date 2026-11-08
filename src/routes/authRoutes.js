'use strict'

import { Router } from 'express'

import { login } from '../controllers/authController.js'

const router = Router()

router.post('/api/auth/login', login)

export default router
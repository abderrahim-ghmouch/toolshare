'use strict'

import { Router } from 'express'
import { install, status } from '../controllers/installationController.js'

const router = Router()
router.get('/api/installation/status', status)
router.post('/api/installation/install', install)

export default router

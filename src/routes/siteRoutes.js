import { Router } from 'express'

import siteController from '../controllers/siteController.js'

const router = Router()

router.get('/api/sites/:siteId/equipment', siteController.listEquipment)
router.get('/api/sites/active', siteController.listActive)

export default router

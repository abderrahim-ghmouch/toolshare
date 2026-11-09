import { Router } from 'express'

import adminController from '../controllers/adminController.js'

const router = Router()

router.get('/api/admin/overview', adminController.getOverview)
router.put('/api/admin/managers/:managerId/sites', adminController.replaceManagerSites)

export default router

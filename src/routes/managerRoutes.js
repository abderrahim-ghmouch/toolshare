import {
    Router
} from 'express'
import {
    createManager,
    changeAssignment
} from '../controllers/managerController.js'
import {
    authMiddleware
} from '../middlewares/authMiddleware.js'
import {
    authorize
} from '../middlewares/roleMiddelware.js'

const router = Router()

// only the admin creates managers and defines (or changes) their store
router.use('/api/managers', authMiddleware, authorize('admin'))

router.post('/api/managers', createManager)
router.patch('/api/managers/:id/store', changeAssignment)

export default router
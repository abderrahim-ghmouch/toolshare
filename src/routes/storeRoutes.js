import {
    Router
} from 'express'
import {
    listStores,
    getStore,
    createStore,
    updateStore,
    deactivateStore,
    activateStore
} from '../controllers/storeController.js'
import {
    authMiddleware
} from '../middlewares/authMiddleware.js'
import {
    authorize
} from '../middlewares/roleMiddelware.js'

const router = Router()

// every store route needs a valid JWT
router.use('/api/stores', authMiddleware)

// reading: admin (all), manager (own store), user (active stores) - filtering is done in the service
router.get('/api/stores', listStores)
router.get('/api/stores/:id', getStore)

// writing: admin only
router.post('/api/stores', authorize('admin'), createStore)
router.patch('/api/stores/:id', authorize('admin'), updateStore)
router.patch('/api/stores/:id/deactivate', authorize('admin'), deactivateStore)
router.patch('/api/stores/:id/activate', authorize('admin'), activateStore)

export default router
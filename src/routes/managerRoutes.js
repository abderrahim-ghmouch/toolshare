import { Router } from 'express'

import managerController from '../controllers/managerController.js'

const router = Router()

router.get('/api/managers/equipment', managerController.listEquipment)
router.post('/api/managers/equipment', managerController.createEquipment)
router.get('/api/managers/equipment/:equipmentId', managerController.getEquipment)
router.patch('/api/managers/equipment/:equipmentId', managerController.updateEquipment)
router.patch(
    '/api/managers/equipment/:equipmentId/availability',
    managerController.setEquipmentAvailability
)
router.delete('/api/managers/equipment/:equipmentId', managerController.deactivateEquipment)
router.post(
    '/api/managers/reservations/:reservationId/handover',
    managerController.handOverReservation
)
router.post(
    '/api/managers/reservations/:reservationId/return',
    managerController.returnReservation
)
router.get('/api/managers/loans/overdue', managerController.listOverdueLoans)
router.get('/api/managers/movements', managerController.listManagerMovements)
router.post('/api/managers/users', managerController.createUser)
router.get('/api/managers/sites', managerController.getSites)
router.put('/api/managers/:managerId/sites', managerController.replaceSites)

export default router

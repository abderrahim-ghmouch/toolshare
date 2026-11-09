import userModel from '../models/userModel.js'
import siteModel from '../models/siteModel.js'
import equipmentModel from '../models/equipmentModel.js'
import reservationModel from '../models/reservationModel.js'

export async function replaceManagerSites(managerId, siteIds) {
    const siteCount = await siteModel.countDocuments({ _id: { $in: siteIds } })

    if (siteCount !== siteIds.length) {
        return { missingSites: true }
    }

    const manager = await userModel.findOneAndUpdate(
        { _id: managerId, role: 'manager' },
        { $set: { assignedSites: siteIds } },
        { new: true, runValidators: true }
    )
        .select('_id name email role assignedSites')
        .populate('assignedSites', 'name')

    return { manager }
}

export async function createUserForManager(managerId, userData) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const isAssignedSite = manager.assignedSites.some(
        assignedSite => assignedSite.toString() === userData.siteId
    )

    if (!isAssignedSite) {
        return { siteNotAssigned: true }
    }

    const siteExists = await siteModel.exists({ _id: userData.siteId })

    if (!siteExists) {
        return { siteNotFound: true }
    }

    const user = await userModel.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: 'user',
        assignedSites: [userData.siteId]
    })

    return userModel.findById(user._id)
        .select('_id name email role assignedSites')
        .populate('assignedSites', 'name')
}

export async function getManagerSites(managerId) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')
        .populate('assignedSites', '_id name createdAt updatedAt')

    return manager?.assignedSites ?? null
}

export async function listManagerEquipment(managerId) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return null
    }

    return equipmentModel.find({ site: { $in: manager.assignedSites } })
        .select('_id reference name description site active available createdAt updatedAt')
        .sort({ name: 1 })
        .populate('site', 'name')
        .lean()
}

export async function getManagerEquipment(managerId, equipmentId) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const equipment = await equipmentModel.findOne({
        _id: equipmentId,
        site: { $in: manager.assignedSites }
    })
        .select('_id reference name description site active available createdAt updatedAt')
        .populate('site', 'name')
        .lean()

    return { equipment }
}

export async function createManagerEquipment(managerId, equipmentData) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const site = await siteModel.findOne({
        _id: equipmentData.siteId,
        active: { $ne: false }
    }).select('_id')

    if (!site) {
        return { siteNotFound: true }
    }

    if (!manager.assignedSites.some(
        assignedSite => assignedSite.toString() === equipmentData.siteId
    )) {
        return { siteNotAssigned: true }
    }

    const [equipment] = await equipmentModel.create([{
        reference: equipmentData.reference,
        name: equipmentData.name,
        description: equipmentData.description,
        site: equipmentData.siteId
    }])

    return equipmentModel.findById(equipment._id)
        .select('_id reference name description site active available createdAt updatedAt')
        .populate('site', 'name')
        .lean()
}

export async function updateManagerEquipment(managerId, equipmentId, updates) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const equipment = await equipmentModel.findOneAndUpdate(
        { _id: equipmentId, site: { $in: manager.assignedSites } },
        { $set: updates },
        { new: true, runValidators: true }
    )
        .select('_id reference name description site active available createdAt updatedAt')
        .populate('site', 'name')
        .lean()

    return { equipment }
}

export async function deactivateManagerEquipment(managerId, equipmentId) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const equipment = await equipmentModel.findOneAndUpdate(
        { _id: equipmentId, site: { $in: manager.assignedSites } },
        { $set: { active: false, available: false } },
        { new: true }
    )
        .select('_id reference name description site active available createdAt updatedAt')
        .populate('site', 'name')
        .lean()

    return { equipment }
}

export async function setManagerEquipmentAvailability(managerId, equipmentId, available) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const equipment = await equipmentModel.findOneAndUpdate(
        { _id: equipmentId, site: { $in: manager.assignedSites }, active: true },
        { $set: { available } },
        { new: true, runValidators: true }
    )
        .select('_id reference name description site active available createdAt updatedAt')
        .populate('site', 'name')
        .lean()

    return { equipment }
}

export async function handOverReservation(managerId, reservationId) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return { managerNotFound: true }
    }

    const reservationScope = {
        _id: reservationId,
        site: { $in: manager.assignedSites }
    }

    const reservation = await reservationModel.findOneAndUpdate(
        {
            ...reservationScope,
            status: 'approved',
            handedOverAt: null
        },
        {
            $set: {
                status: 'checked_out',
                handedOverAt: new Date(),
                handedOverBy: manager._id
            }
        },
        { new: true, runValidators: true }
    )
        .select('_id user equipment site startDate endDate status handedOverAt handedOverBy createdAt updatedAt')
        .populate('user', 'name email')
        .populate('equipment', 'name')
        .populate('site', 'name')
        .populate('handedOverBy', 'name email')
        .lean()

    if (reservation) {
        return { reservation }
    }

    const existingReservation = await reservationModel.exists(reservationScope)

    return existingReservation
        ? { handoverNotAllowed: true }
        : { reservationNotFound: true }
}

export async function returnReservation(managerId, reservationId, condition) {
    const session = await userModel.db.startSession()

    try {
        let result

        await session.withTransaction(async () => {
            const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
                .select('assignedSites')
                .session(session)

            if (!manager) {
                result = { managerNotFound: true }
                return
            }

            const reservationScope = {
                _id: reservationId,
                site: { $in: manager.assignedSites }
            }

            if (condition === 'damaged') {
                const currentReservation = await reservationModel.findOne({
                    ...reservationScope,
                    status: 'checked_out'
                }).select('equipment site').session(session)

                if (currentReservation) {
                    const equipment = await equipmentModel.findOne({
                        _id: currentReservation.equipment,
                        site: currentReservation.site
                    }).session(session)

                    if (!equipment) {
                        result = { equipmentNotFound: true }
                        return
                    }
                }
            }

            const reservation = await reservationModel.findOneAndUpdate(
                { ...reservationScope, status: 'checked_out' },
                {
                    $set: {
                        status: 'completed',
                        returnCondition: condition,
                        returnedAt: new Date(),
                        returnedBy: manager._id
                    }
                },
                { new: true, runValidators: true, session }
            )
                .select('_id user equipment site startDate endDate status handedOverAt handedOverBy returnCondition returnedAt returnedBy createdAt updatedAt')

            if (!reservation) {
                const existingReservation = await reservationModel.exists(reservationScope).session(session)
                result = existingReservation
                    ? { returnNotAllowed: true }
                    : { reservationNotFound: true }
                return
            }

            if (condition === 'damaged') {
                const equipment = await equipmentModel.findOneAndUpdate(
                    {
                        _id: reservation.equipment,
                        site: reservation.site
                    },
                    { $set: { available: false } },
                    { new: true, session }
                )

                if (!equipment) {
                    throw new Error('Equipment was not found while recording a damaged return')
                }
            }

            await reservationModel.populate(reservation, [
                { path: 'user', select: 'name email' },
                { path: 'equipment', select: 'name' },
                { path: 'site', select: 'name' },
                { path: 'handedOverBy', select: 'name email' },
                { path: 'returnedBy', select: 'name email' }
            ])

            result = { reservation }
        })

        return result
    } finally {
        await session.endSession()
    }
}

export async function listOverdueLoans(managerId, now = new Date()) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return null
    }

    return reservationModel.find({
        site: { $in: manager.assignedSites },
        status: 'checked_out',
        endDate: { $lt: now }
    })
        .select('_id user equipment site startDate endDate status handedOverAt handedOverBy')
        .sort({ endDate: 1 })
        .populate('user', 'name email')
        .populate('equipment', 'name')
        .populate('site', 'name')
        .populate('handedOverBy', 'name email')
        .lean()
}

export async function listManagerMovements(managerId) {
    const manager = await userModel.findOne({ _id: managerId, role: 'manager' })
        .select('assignedSites')

    if (!manager) {
        return null
    }

    const reservations = await reservationModel.find({
        site: { $in: manager.assignedSites },
        $or: [
            { handedOverAt: { $exists: true, $ne: null } },
            { returnedAt: { $exists: true, $ne: null } }
        ]
    })
        .select('_id user equipment site startDate endDate status handedOverAt handedOverBy returnedAt returnedBy returnCondition')
        .populate('user', 'name email')
        .populate('equipment', 'name')
        .populate('site', 'name')
        .populate('handedOverBy', 'name email')
        .populate('returnedBy', 'name email')
        .lean()

    const movements = []

    for (const reservation of reservations) {
        if (reservation.handedOverAt) {
            movements.push({
                type: 'handover',
                occurredAt: reservation.handedOverAt,
                reservationId: reservation._id,
                borrower: reservation.user,
                equipment: reservation.equipment,
                site: reservation.site,
                manager: reservation.handedOverBy,
                startDate: reservation.startDate,
                endDate: reservation.endDate
            })
        }

        if (reservation.returnedAt) {
            movements.push({
                type: 'return',
                occurredAt: reservation.returnedAt,
                reservationId: reservation._id,
                borrower: reservation.user,
                equipment: reservation.equipment,
                site: reservation.site,
                manager: reservation.returnedBy,
                condition: reservation.returnCondition,
                startDate: reservation.startDate,
                endDate: reservation.endDate
            })
        }
    }

    return movements.sort((first, second) =>
        new Date(second.occurredAt) - new Date(first.occurredAt)
    )
}

export default {
    replaceManagerSites,
    createUserForManager,
    getManagerSites,
    listManagerEquipment,
    getManagerEquipment,
    createManagerEquipment,
    updateManagerEquipment,
    deactivateManagerEquipment,
    setManagerEquipmentAvailability,
    handOverReservation,
    returnReservation,
    listOverdueLoans,
    listManagerMovements
}

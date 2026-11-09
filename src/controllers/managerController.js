import managerService, {
    DuplicateUserEmailError,
    InvalidManagerAssignmentError,
    InvalidManagedUserDataError,
    ManagedUserRoleNotAllowedError,
    InvalidManagedEquipmentDataError,
    DuplicateEquipmentReferenceError,
    ManagedSiteNotAllowedError,
    ManagedEquipmentNotFoundError,
    ManagedReservationNotFoundError,
    ManagerNotAllowedError,
    ManagerNotFoundError,
    InvalidManagedReservationError,
    InvalidManagerActivityQueryError,
    ReservationHandoverNotAllowedError,
    ReservationReturnNotAllowedError,
    SiteNotFoundError
} from '../services/managerService.js'

function getManagerId(req, res) {
    const managerId = req.user?._id?.toString()

    if (!managerId) {
        res.status(401).json({ error: 'Authentication required' })
        return null
    }

    return managerId
}

function handleEquipmentError(error, res, next) {
    if (error instanceof InvalidManagedEquipmentDataError) {
        return res.status(400).json({ error: error.message })
    }

    if (error instanceof ManagerNotAllowedError || error instanceof ManagedSiteNotAllowedError) {
        return res.status(403).json({ error: error.message })
    }

    if (error instanceof ManagedEquipmentNotFoundError || error instanceof SiteNotFoundError) {
        return res.status(404).json({ error: error.message })
    }

    return next(error)
}

export async function listEquipment(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const equipment = await managerService.listManagerEquipment(managerId)
        return res.status(200).json(equipment)
    } catch (error) {
        return handleEquipmentError(error, res, next)
    }
}

export async function getEquipment(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const equipment = await managerService.getManagerEquipment(
            managerId,
            req.params.equipmentId
        )
        return res.status(200).json(equipment)
    } catch (error) {
        return handleEquipmentError(error, res, next)
    }
}

export async function createEquipment(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const equipment = await managerService.createManagerEquipment(managerId, req.body)
        return res.status(201).json(equipment)
    } catch (error) {
        if (error instanceof DuplicateEquipmentReferenceError) {
            return res.status(409).json({ error: error.message })
        }

        return handleEquipmentError(error, res, next)
    }
}

export async function updateEquipment(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const equipment = await managerService.updateManagerEquipment(
            managerId,
            req.params.equipmentId,
            req.body
        )
        return res.status(200).json(equipment)
    } catch (error) {
        if (error instanceof DuplicateEquipmentReferenceError) {
            return res.status(409).json({ error: error.message })
        }

        return handleEquipmentError(error, res, next)
    }
}

export async function deactivateEquipment(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const equipment = await managerService.deactivateManagerEquipment(
            managerId,
            req.params.equipmentId
        )
        return res.status(200).json(equipment)
    } catch (error) {
        return handleEquipmentError(error, res, next)
    }
}

export async function setEquipmentAvailability(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const equipment = await managerService.setManagerEquipmentAvailability(
            managerId,
            req.params.equipmentId,
            req.body?.available
        )
        return res.status(200).json(equipment)
    } catch (error) {
        return handleEquipmentError(error, res, next)
    }
}

export async function handOverReservation(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const reservation = await managerService.handOverReservation(
            managerId,
            req.params.reservationId
        )
        return res.status(200).json(reservation)
    } catch (error) {
        if (error instanceof InvalidManagedReservationError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ReservationHandoverNotAllowedError) {
            return res.status(409).json({ error: error.message })
        }

        if (error instanceof ManagedReservationNotFoundError) {
            return res.status(404).json({ error: error.message })
        }

        if (error instanceof ManagerNotAllowedError) {
            return res.status(403).json({ error: error.message })
        }

        return next(error)
    }
}

export async function returnReservation(req, res, next) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const reservation = await managerService.returnReservation(
            managerId,
            req.params.reservationId,
            req.body?.condition
        )
        return res.status(200).json(reservation)
    } catch (error) {
        if (error instanceof InvalidManagedReservationError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ReservationReturnNotAllowedError) {
            return res.status(409).json({ error: error.message })
        }

        if (
            error instanceof ManagedReservationNotFoundError ||
            error instanceof ManagedEquipmentNotFoundError
        ) {
            return res.status(404).json({ error: error.message })
        }

        if (error instanceof ManagerNotAllowedError) {
            return res.status(403).json({ error: error.message })
        }

        return next(error)
    }
}

async function handleManagerActivityRequest(req, res, next, serviceMethod) {
    const managerId = getManagerId(req, res)
    if (!managerId) return

    try {
        const result = await serviceMethod(managerId)
        return res.status(200).json(result)
    } catch (error) {
        if (error instanceof InvalidManagerActivityQueryError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ManagerNotAllowedError) {
            return res.status(403).json({ error: error.message })
        }

        return next(error)
    }
}

export async function listOverdueLoans(req, res, next) {
    return handleManagerActivityRequest(
        req,
        res,
        next,
        managerService.listOverdueLoans
    )
}

export async function listManagerMovements(req, res, next) {
    return handleManagerActivityRequest(
        req,
        res,
        next,
        managerService.listManagerMovements
    )
}

export async function createUser(req, res, next) {
    const managerId = req.user?._id?.toString()

    if (!managerId) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    try {
        const user = await managerService.createUser(managerId, req.body)

        return res.status(201).json(user)
    } catch (error) {
        if (error instanceof ManagedUserRoleNotAllowedError) {
            return res.status(403).json({ error: error.message })
        }

        if (error instanceof InvalidManagedUserDataError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof DuplicateUserEmailError) {
            return res.status(409).json({ error: error.message })
        }

        if (error instanceof ManagerNotAllowedError || error instanceof ManagedSiteNotAllowedError) {
            return res.status(403).json({ error: error.message })
        }

        if (error instanceof SiteNotFoundError) {
            return res.status(404).json({ error: error.message })
        }

        return next(error)
    }
}

export async function getSites(req, res, next) {
    const managerId = req.user?._id?.toString()

    if (!managerId) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    try {
        const sites = await managerService.getManagerSites(managerId)

        return res.status(200).json(sites)
    } catch (error) {
        if (error instanceof InvalidManagerAssignmentError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ManagerNotAllowedError) {
            return res.status(403).json({ error: error.message })
        }

        return next(error)
    }
}

export async function replaceSites(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' })
    }

    try {
        const manager = await managerService.replaceManagerSites(
            req.params.managerId,
            req.body?.siteIds
        )

        return res.status(200).json(manager)
    } catch (error) {
        if (error instanceof InvalidManagerAssignmentError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ManagerNotFoundError || error instanceof SiteNotFoundError) {
            return res.status(404).json({ error: error.message })
        }

        return next(error)
    }
}

export default {
    createUser,
    getSites,
    replaceSites,
    listEquipment,
    getEquipment,
    createEquipment,
    updateEquipment,
    deactivateEquipment,
    setEquipmentAvailability,
    handOverReservation,
    returnReservation,
    listOverdueLoans,
    listManagerMovements
}

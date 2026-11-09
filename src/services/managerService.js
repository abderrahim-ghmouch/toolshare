import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

import managerRepository from '../repositories/managerRepository.js'

export class InvalidManagerAssignmentError extends Error {}
export class ManagerNotFoundError extends Error {}
export class SiteNotFoundError extends Error {}
export class InvalidManagedUserDataError extends Error {}
export class ManagedUserRoleNotAllowedError extends Error {}
export class ManagerNotAllowedError extends Error {}
export class ManagedSiteNotAllowedError extends Error {}
export class DuplicateUserEmailError extends Error {}
export class InvalidManagedEquipmentDataError extends Error {}
export class ManagedEquipmentNotFoundError extends Error {}
export class DuplicateEquipmentReferenceError extends Error {}
export class InvalidManagedReservationError extends Error {}
export class ManagedReservationNotFoundError extends Error {}
export class ReservationHandoverNotAllowedError extends Error {}
export class ReservationReturnNotAllowedError extends Error {}
export class InvalidManagerActivityQueryError extends Error {}

export async function replaceManagerSites(managerId, siteIds) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagerAssignmentError('Invalid manager ID')
    }

    if (!Array.isArray(siteIds) || siteIds.some(
        siteId => typeof siteId !== 'string' || !mongoose.Types.ObjectId.isValid(siteId)
    )) {
        throw new InvalidManagerAssignmentError('siteIds must be an array of valid site IDs')
    }

    const normalizedSiteIds = siteIds.map(
        siteId => new mongoose.Types.ObjectId(siteId).toString()
    )

    if (new Set(normalizedSiteIds).size !== normalizedSiteIds.length) {
        throw new InvalidManagerAssignmentError('siteIds must not contain duplicates')
    }

    const result = await managerRepository.replaceManagerSites(managerId, normalizedSiteIds)

    if (result.missingSites) {
        throw new SiteNotFoundError('One or more sites were not found')
    }

    if (!result.manager) {
        throw new ManagerNotFoundError('Manager not found')
    }

    return result.manager
}

export async function createUser(managerId, userData) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagedUserDataError('Invalid manager ID')
    }

    if (userData?.role !== undefined && userData.role !== 'user') {
        throw new ManagedUserRoleNotAllowedError('Managers can only create users with the user role')
    }

    if (
        !userData ||
        typeof userData.name !== 'string' ||
        !userData.name.trim() ||
        typeof userData.email !== 'string' ||
        !userData.email.trim().includes('@') ||
        typeof userData.password !== 'string' ||
        !userData.password ||
        typeof userData.siteId !== 'string' ||
        !mongoose.Types.ObjectId.isValid(userData.siteId)
    ) {
        throw new InvalidManagedUserDataError(
            'Provide a name, valid email, password, and valid siteId; role must be user'
        )
    }

    const normalizedSiteId = new mongoose.Types.ObjectId(userData.siteId).toString()
    const password = await bcrypt.hash(userData.password, 10)

    try {
        const result = await managerRepository.createUserForManager(managerId, {
            name: userData.name.trim(),
            email: userData.email.trim(),
            password,
            siteId: normalizedSiteId
        })

        if (result.managerNotFound) {
            throw new ManagerNotAllowedError('Only an existing manager can create users')
        }

        if (result.siteNotAssigned) {
            throw new ManagedSiteNotAllowedError('The manager is not assigned to this site')
        }

        if (result.siteNotFound) {
            throw new SiteNotFoundError('Site not found')
        }

        return result
    } catch (error) {
        if (error?.code === 11000) {
            throw new DuplicateUserEmailError('A user with this email already exists')
        }

        throw error
    }
}

export async function getManagerSites(managerId) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagerAssignmentError('Invalid manager ID')
    }

    const sites = await managerRepository.getManagerSites(managerId)

    if (!sites) {
        throw new ManagerNotAllowedError('Only a manager can view assigned sites')
    }

    return sites
}

function validateManagerId(managerId) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagedEquipmentDataError('Invalid manager ID')
    }
}

function validateEquipmentId(equipmentId) {
    if (typeof equipmentId !== 'string' || !mongoose.Types.ObjectId.isValid(equipmentId)) {
        throw new InvalidManagedEquipmentDataError('Invalid equipment ID')
    }

    return new mongoose.Types.ObjectId(equipmentId).toString()
}

function normalizeEquipmentData(data, allowedFields, requiredFields = []) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new InvalidManagedEquipmentDataError('A JSON object is required')
    }

    if (Object.keys(data).some(field => !allowedFields.includes(field))) {
        throw new InvalidManagedEquipmentDataError(
            `Only these fields are allowed: ${allowedFields.join(', ')}`
        )
    }

    for (const field of requiredFields) {
        if (data[field] === undefined) {
            throw new InvalidManagedEquipmentDataError(`${field} is required`)
        }
    }

    const normalized = {}

    for (const field of allowedFields) {
        if (data[field] === undefined) {
            continue
        }

        if (
            typeof data[field] !== 'string' ||
            (['reference', 'name', 'siteId'].includes(field) && !data[field].trim())
        ) {
            throw new InvalidManagedEquipmentDataError(
                `${field} must be ${['description'].includes(field) ? 'a string' : 'a non-empty string'}`
            )
        }

        normalized[field] = data[field].trim()
    }

    return normalized
}

export async function listManagerEquipment(managerId) {
    validateManagerId(managerId)

    const equipment = await managerRepository.listManagerEquipment(managerId)

    if (!equipment) {
        throw new ManagerNotAllowedError('Only a manager can manage equipment')
    }

    return equipment
}

export async function getManagerEquipment(managerId, equipmentId) {
    validateManagerId(managerId)
    const normalizedEquipmentId = validateEquipmentId(equipmentId)

    const result = await managerRepository.getManagerEquipment(managerId, normalizedEquipmentId)

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can manage equipment')
    }

    if (!result.equipment) {
        throw new ManagedEquipmentNotFoundError('Equipment not found')
    }

    return result.equipment
}

export async function createManagerEquipment(managerId, data) {
    validateManagerId(managerId)

    const equipmentData = normalizeEquipmentData(
        data,
        ['reference', 'name', 'description', 'siteId'],
        ['reference', 'name', 'siteId']
    )

    if (
        typeof equipmentData.siteId !== 'string' ||
        !mongoose.Types.ObjectId.isValid(equipmentData.siteId)
    ) {
        throw new InvalidManagedEquipmentDataError('siteId must be a valid site ID')
    }

    equipmentData.siteId = new mongoose.Types.ObjectId(equipmentData.siteId).toString()
    equipmentData.reference = equipmentData.reference.trim()
    equipmentData.description ??= ''

    let result
    try {
        result = await managerRepository.createManagerEquipment(managerId, equipmentData)
    } catch (error) {
        if (error?.code === 11000 && error.keyPattern?.reference) {
            throw new DuplicateEquipmentReferenceError('Equipment reference already exists')
        }

        throw error
    }

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can manage equipment')
    }

    if (result.siteNotFound) {
        throw new SiteNotFoundError('Active site not found')
    }

    if (result.siteNotAssigned) {
        throw new ManagedSiteNotAllowedError('The manager is not assigned to this site')
    }

    return result
}

export async function updateManagerEquipment(managerId, equipmentId, data) {
    validateManagerId(managerId)
    const normalizedEquipmentId = validateEquipmentId(equipmentId)
    const updates = normalizeEquipmentData(data, ['reference', 'name', 'description'])

    if (Object.keys(updates).length === 0) {
        throw new InvalidManagedEquipmentDataError('At least one editable field is required')
    }

    let result
    try {
        result = await managerRepository.updateManagerEquipment(
            managerId,
            normalizedEquipmentId,
            updates
        )
    } catch (error) {
        if (error?.code === 11000 && error.keyPattern?.reference) {
            throw new DuplicateEquipmentReferenceError('Equipment reference already exists')
        }

        throw error
    }

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can manage equipment')
    }

    if (!result.equipment) {
        throw new ManagedEquipmentNotFoundError('Equipment not found')
    }

    return result.equipment
}

export async function deactivateManagerEquipment(managerId, equipmentId) {
    validateManagerId(managerId)
    const normalizedEquipmentId = validateEquipmentId(equipmentId)

    const result = await managerRepository.deactivateManagerEquipment(
        managerId,
        normalizedEquipmentId
    )

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can manage equipment')
    }

    if (!result.equipment) {
        throw new ManagedEquipmentNotFoundError('Equipment not found')
    }

    return result.equipment
}

export async function setManagerEquipmentAvailability(managerId, equipmentId, available) {
    validateManagerId(managerId)
    const normalizedEquipmentId = validateEquipmentId(equipmentId)

    if (typeof available !== 'boolean') {
        throw new InvalidManagedEquipmentDataError('available must be a boolean')
    }

    const result = await managerRepository.setManagerEquipmentAvailability(
        managerId,
        normalizedEquipmentId,
        available
    )

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can manage equipment')
    }

    if (!result.equipment) {
        throw new ManagedEquipmentNotFoundError('Active equipment not found')
    }

    return result.equipment
}

export async function handOverReservation(managerId, reservationId) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagedReservationError('Invalid manager ID')
    }

    if (typeof reservationId !== 'string' || !mongoose.Types.ObjectId.isValid(reservationId)) {
        throw new InvalidManagedReservationError('Invalid reservation ID')
    }

    const normalizedReservationId = new mongoose.Types.ObjectId(reservationId).toString()
    const result = await managerRepository.handOverReservation(managerId, normalizedReservationId)

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can hand over reservations')
    }

    if (result.reservationNotFound) {
        throw new ManagedReservationNotFoundError('Reservation not found')
    }

    if (result.handoverNotAllowed) {
        throw new ReservationHandoverNotAllowedError(
            'Only an approved reservation that has not been handed over can be handed over'
        )
    }

    return result.reservation
}

export async function returnReservation(managerId, reservationId, condition) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagedReservationError('Invalid manager ID')
    }

    if (typeof reservationId !== 'string' || !mongoose.Types.ObjectId.isValid(reservationId)) {
        throw new InvalidManagedReservationError('Invalid reservation ID')
    }

    if (!['good', 'damaged'].includes(condition)) {
        throw new InvalidManagedReservationError('condition must be good or damaged')
    }

    const normalizedReservationId = new mongoose.Types.ObjectId(reservationId).toString()
    const result = await managerRepository.returnReservation(
        managerId,
        normalizedReservationId,
        condition
    )

    if (result.managerNotFound) {
        throw new ManagerNotAllowedError('Only a manager can record equipment returns')
    }

    if (result.reservationNotFound) {
        throw new ManagedReservationNotFoundError('Reservation not found')
    }

    if (result.equipmentNotFound) {
        throw new ManagedEquipmentNotFoundError('Reservation equipment not found')
    }

    if (result.returnNotAllowed) {
        throw new ReservationReturnNotAllowedError(
            'Only a checked-out reservation can be returned'
        )
    }

    return result.reservation
}

export async function listOverdueLoans(managerId) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagerActivityQueryError('Invalid manager ID')
    }

    const loans = await managerRepository.listOverdueLoans(managerId, new Date())

    if (!loans) {
        throw new ManagerNotAllowedError('Only a manager can view overdue loans')
    }

    return loans
}

export async function listManagerMovements(managerId) {
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
        throw new InvalidManagerActivityQueryError('Invalid manager ID')
    }

    const movements = await managerRepository.listManagerMovements(managerId)

    if (!movements) {
        throw new ManagerNotAllowedError('Only a manager can view store movements')
    }

    return movements
}

export default {
    replaceManagerSites,
    createUser,
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

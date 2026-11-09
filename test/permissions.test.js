import assert from 'node:assert/strict'
import test from 'node:test'

import managerController from '../src/controllers/managerController.js'
import adminController, { getOverview } from '../src/controllers/adminController.js'
import siteController from '../src/controllers/siteController.js'
import { getMyLoans } from '../src/controllers/userController.js'
import managerRepository from '../src/repositories/managerRepository.js'
import siteRepository from '../src/repositories/siteRepository.js'
import userRepository from '../src/repositories/userRepository.js'
import equipmentModel from '../src/models/equipmentModel.js'
import reservationModel from '../src/models/reservationModel.js'
import siteModel from '../src/models/siteModel.js'
import userModel from '../src/models/userModel.js'
import adminService from '../src/services/adminService.js'
import managerService, {
    DuplicateEquipmentReferenceError,
    InvalidManagedEquipmentDataError,
    ManagerNotAllowedError
} from '../src/services/managerService.js'
import siteService, {
    ActiveSiteNotFoundError,
    InvalidSiteIdError
} from '../src/services/siteService.js'
import userService from '../src/services/userService.js'
import app from '../app.js'

const managerId = '507f1f77bcf86cd799439011'
const assignedSiteId = '507f1f77bcf86cd799439012'
const otherSiteId = '507f1f77bcf86cd799439013'
const equipmentId = '507f1f77bcf86cd799439014'
const reservationId = '507f1f77bcf86cd799439015'

function responseRecorder() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code
            return this
        },
        json(body) {
            this.body = body
            return this
        }
    }
}

function managerQuery() {
    return {
        select() {
            return this
        },
        session() {
            return this
        },
        then(resolve, reject) {
            return Promise.resolve({ _id: managerId, assignedSites: [assignedSiteId] })
                .then(resolve, reject)
        }
    }
}

function queryResult(value) {
    return {
        select() {
            return this
        },
        sort() {
            return this
        },
        populate() {
            return this
        },
        session() {
            return this
        },
        lean() {
            return Promise.resolve(value)
        },
        then(resolve, reject) {
            return Promise.resolve(value).then(resolve, reject)
        }
    }
}

test('manager and personal endpoints reject requests without an authenticated identity', async () => {
    for (const controller of [
        managerController.listEquipment,
        managerController.listOverdueLoans,
        managerController.listManagerMovements,
        managerController.handOverReservation,
        managerController.returnReservation,
        managerController.createEquipment,
        managerController.updateEquipment,
        managerController.deactivateEquipment,
        managerController.setEquipmentAvailability,
        managerController.createUser,
        managerController.getSites
    ]) {
        const res = responseRecorder()
        await controller({ params: {}, body: {} }, res, error => {
            throw error
        })
        assert.equal(res.statusCode, 401, controller.name)
    }

    const userResponse = responseRecorder()
    await getMyLoans({ user: null }, userResponse, error => {
        throw error
    })
    assert.equal(userResponse.statusCode, 401)

    const adminResponse = responseRecorder()
    await getOverview({ user: null }, adminResponse, error => {
        throw error
    })
    assert.equal(adminResponse.statusCode, 401)
})

test('manager equipment reads and updates are constrained to assigned sites', async t => {
    const originalFindOne = userModel.findOne
    const originalEquipmentFindOne = equipmentModel.findOne
    const originalEquipmentFindOneAndUpdate = equipmentModel.findOneAndUpdate
    const filters = []

    t.after(() => {
        userModel.findOne = originalFindOne
        equipmentModel.findOne = originalEquipmentFindOne
        equipmentModel.findOneAndUpdate = originalEquipmentFindOneAndUpdate
    })

    userModel.findOne = () => managerQuery()
    equipmentModel.findOne = filter => {
        filters.push(filter)
        return queryResult({ _id: equipmentId, site: assignedSiteId })
    }
    equipmentModel.findOneAndUpdate = (filter) => {
        filters.push(filter)
        return queryResult({ _id: equipmentId, site: assignedSiteId })
    }

    await managerRepository.getManagerEquipment(managerId, equipmentId)
    await managerRepository.updateManagerEquipment(managerId, equipmentId, { name: 'Updated' })
    await managerRepository.setManagerEquipmentAvailability(managerId, equipmentId, false)

    assert.equal(filters.length, 3)
    for (const filter of filters) {
        assert.equal(filter._id, equipmentId)
        assert.deepEqual(filter.site.$in, [assignedSiteId])
        assert.ok(!filter.site.$in.includes(otherSiteId))
    }
})

test('manager lookups require the authenticated account to have the manager role', async t => {
    const originalFindOne = userModel.findOne
    let managerFilter

    t.after(() => {
        userModel.findOne = originalFindOne
    })

    userModel.findOne = filter => {
        managerFilter = filter
        return {
            select() {
                return this
            },
            then(resolve, reject) {
                return Promise.resolve(null).then(resolve, reject)
            }
        }
    }

    const result = await managerRepository.listManagerEquipment(managerId)

    assert.equal(result, null)
    assert.deepEqual(managerFilter, { _id: managerId, role: 'manager' })
})

test('assigned site endpoint returns 403 when the authenticated account is not a manager', async t => {
    const originalGetManagerSites = managerService.getManagerSites

    t.after(() => {
        managerService.getManagerSites = originalGetManagerSites
    })

    managerService.getManagerSites = async () => {
        throw new ManagerNotAllowedError('Only a manager can view assigned sites')
    }

    const res = responseRecorder()
    await managerController.getSites(
        { user: { _id: managerId, role: 'user' } },
        res,
        error => {
            throw error
        }
    )

    assert.equal(res.statusCode, 403)
    assert.equal(res.body.error, 'Only a manager can view assigned sites')
})

test('manager loses access to the old site after an admin reassigns them', async t => {
    const originalCountDocuments = siteModel.countDocuments
    const originalManagerUpdate = userModel.findOneAndUpdate
    const originalManagerFind = userModel.findOne
    const originalEquipmentFind = equipmentModel.find
    const originalEquipmentFindOne = equipmentModel.findOne
    const originalReservationUpdate = reservationModel.findOneAndUpdate
    const originalReservationExists = reservationModel.exists
    let currentAssignments = [assignedSiteId]
    let equipmentListFilter
    let equipmentLookupFilter
    let reservationFilter

    t.after(() => {
        siteModel.countDocuments = originalCountDocuments
        userModel.findOneAndUpdate = originalManagerUpdate
        userModel.findOne = originalManagerFind
        equipmentModel.find = originalEquipmentFind
        equipmentModel.findOne = originalEquipmentFindOne
        reservationModel.findOneAndUpdate = originalReservationUpdate
        reservationModel.exists = originalReservationExists
    })

    siteModel.countDocuments = async ({ _id }) => _id.$in.length
    userModel.findOneAndUpdate = (filter, update) => {
        assert.deepEqual(filter, { _id: managerId, role: 'manager' })
        currentAssignments = update.$set.assignedSites
        return queryResult({ _id: managerId, role: 'manager', assignedSites: currentAssignments })
    }
    userModel.findOne = filter => {
        assert.deepEqual(filter, { _id: managerId, role: 'manager' })
        return {
            select() {
                return this
            },
            then(resolve, reject) {
                return Promise.resolve({ _id: managerId, assignedSites: currentAssignments })
                    .then(resolve, reject)
            }
        }
    }

    await managerService.replaceManagerSites(managerId, [otherSiteId])

    equipmentModel.find = filter => {
        equipmentListFilter = filter
        return queryResult([])
    }
    equipmentModel.findOne = filter => {
        equipmentLookupFilter = filter
        return queryResult(null)
    }

    assert.deepEqual(await managerRepository.listManagerEquipment(managerId), [])
    const oldEquipment = await managerRepository.getManagerEquipment(managerId, equipmentId)
    assert.equal(oldEquipment.equipment, null)
    assert.deepEqual(equipmentListFilter.site.$in, [otherSiteId])
    assert.deepEqual(equipmentLookupFilter.site.$in, [otherSiteId])
    assert.ok(!equipmentLookupFilter.site.$in.includes(assignedSiteId))

    reservationModel.findOneAndUpdate = filter => {
        reservationFilter = filter
        return queryResult(null)
    }
    reservationModel.exists = async () => false

    const oldReservation = await managerRepository.handOverReservation(managerId, reservationId)
    assert.equal(oldReservation.reservationNotFound, true)
    assert.deepEqual(reservationFilter.site.$in, [otherSiteId])
    assert.ok(!reservationFilter.site.$in.includes(assignedSiteId))
})

test('manager cannot create equipment at an unassigned site', async t => {
    const originalFindOne = userModel.findOne
    const originalSiteFindOne = siteModel.findOne
    const originalCreate = equipmentModel.create
    let createCalled = false
    let siteFilter

    t.after(() => {
        userModel.findOne = originalFindOne
        siteModel.findOne = originalSiteFindOne
        equipmentModel.create = originalCreate
    })

    userModel.findOne = () => managerQuery()
    siteModel.findOne = filter => {
        siteFilter = filter
        return { select: async () => ({ _id: otherSiteId }) }
    }
    equipmentModel.create = async () => {
        createCalled = true
    }

    const result = await managerRepository.createManagerEquipment(managerId, {
        siteId: otherSiteId,
        name: 'Out-of-scope equipment',
        description: ''
    })

    assert.deepEqual(siteFilter, { _id: otherSiteId, active: { $ne: false } })
    assert.equal(result.siteNotAssigned, true)
    assert.equal(createCalled, false)
})

test('equipment schema requires a globally unique reference and site', async () => {
    assert.equal(equipmentModel.schema.path('reference').options.required, true)
    assert.equal(equipmentModel.schema.path('reference').options.unique, true)
    assert.equal(equipmentModel.schema.path('site').options.required, true)
    assert.equal(equipmentModel.schema.path('site').options.ref, 'site')
    assert.equal(equipmentModel.schema.path('available').options.default, true)

    const equipment = new equipmentModel({
        reference: '',
        name: 'Drill',
        site: assignedSiteId
    })
    await assert.rejects(() => equipment.validate())
})

test('manager equipment creation requires and trims the unique reference', async t => {
    let repositoryInput
    const originalRepositoryMethod = managerRepository.createManagerEquipment

    t.after(() => {
        managerRepository.createManagerEquipment = originalRepositoryMethod
    })

    managerRepository.createManagerEquipment = async (_managerId, input) => {
        repositoryInput = input
        return { reference: input.reference, name: input.name }
    }

    await managerService.createManagerEquipment(managerId, {
        reference: '  TOOL-001 ',
        name: 'Drill',
        siteId: assignedSiteId
    })
    assert.equal(repositoryInput.reference, 'TOOL-001')

    await assert.rejects(
        () => managerService.createManagerEquipment(managerId, {
            reference: ' ',
            name: 'Drill',
            siteId: assignedSiteId
        }),
        InvalidManagedEquipmentDataError
    )
})

test('duplicate equipment references are reported as conflicts', async t => {
    const original = managerRepository.createManagerEquipment

    t.after(() => {
        managerRepository.createManagerEquipment = original
    })

    managerRepository.createManagerEquipment = async () => {
        const error = new Error('duplicate key')
        error.code = 11000
        error.keyPattern = { reference: 1 }
        throw error
    }

    await assert.rejects(
        () => managerService.createManagerEquipment(managerId, {
            reference: 'TOOL-001',
            name: 'Drill',
            siteId: assignedSiteId
        }),
        DuplicateEquipmentReferenceError
    )
})

test('manager can only create users with the user role', async () => {
    for (const role of ['admin', 'manager', 'unknown']) {
        const res = responseRecorder()
        await managerController.createUser(
            {
                user: { _id: managerId, role: 'manager' },
                body: {
                    name: 'New Account',
                    email: 'new@example.com',
                    password: 'password',
                    siteId: assignedSiteId,
                    role
                }
            },
            res,
            error => {
                throw error
            }
        )

        assert.equal(res.statusCode, 403, `role=${role}`)
    }
})

test('manager user creation endpoint creates and returns a user', async t => {
    const originalCreateUser = managerService.createUser
    let serviceArguments

    t.after(() => {
        managerService.createUser = originalCreateUser
    })

    managerService.createUser = async (...args) => {
        serviceArguments = args
        return {
            _id: 'new-user-id',
            name: 'New Account',
            email: 'new@example.com',
            role: 'user',
            assignedSites: [{ _id: assignedSiteId, name: 'Assigned site' }]
        }
    }

    const res = responseRecorder()
    await managerController.createUser(
        {
            user: { _id: managerId, role: 'manager' },
            body: {
                name: 'New Account',
                email: 'new@example.com',
                password: 'secure-password',
                siteId: assignedSiteId
            }
        },
        res,
        error => {
            throw error
        }
    )

    assert.equal(res.statusCode, 201)
    assert.deepEqual(serviceArguments, [
        managerId,
        {
            name: 'New Account',
            email: 'new@example.com',
            password: 'secure-password',
            siteId: assignedSiteId
        }
    ])
    assert.equal(res.body.role, 'user')
    assert.equal('password' in res.body, false)
})

test('reservation handover is restricted to manager-assigned sites', async t => {
    const originalFindOne = userModel.findOne
    const originalFindOneAndUpdate = reservationModel.findOneAndUpdate
    const originalExists = reservationModel.exists
    let filter

    t.after(() => {
        userModel.findOne = originalFindOne
        reservationModel.findOneAndUpdate = originalFindOneAndUpdate
        reservationModel.exists = originalExists
    })

    userModel.findOne = () => managerQuery()
    reservationModel.findOneAndUpdate = query => {
        filter = query
        return queryResult(null)
    }
    reservationModel.exists = async () => true

    const result = await managerRepository.handOverReservation(managerId, reservationId)

    assert.deepEqual(filter.site.$in, [assignedSiteId])
    assert.equal(filter._id, reservationId)
    assert.equal(filter.status, 'approved')
    assert.equal(result.handoverNotAllowed, true)
})

test('reservation return is restricted to manager-assigned sites', async t => {
    const originalStartSession = userModel.db.startSession
    const originalFindOne = userModel.findOne
    const originalFindOneAndUpdate = reservationModel.findOneAndUpdate
    const originalExists = reservationModel.exists
    let filter
    const session = {
        withTransaction: callback => callback(),
        endSession: async () => {}
    }

    t.after(() => {
        userModel.db.startSession = originalStartSession
        userModel.findOne = originalFindOne
        reservationModel.findOneAndUpdate = originalFindOneAndUpdate
        reservationModel.exists = originalExists
    })

    userModel.db.startSession = async () => session
    userModel.findOne = () => managerQuery()
    reservationModel.findOneAndUpdate = query => {
        filter = query
        return queryResult(null)
    }
    reservationModel.exists = () => ({
        session: async () => true
    })

    const result = await managerRepository.returnReservation(managerId, reservationId, 'good')

    assert.equal(result.returnNotAllowed, true)
    assert.deepEqual(filter.site.$in, [assignedSiteId])
    assert.ok(!filter.site.$in.includes(otherSiteId))
    assert.equal(filter.status, 'checked_out')
})

test('overdue loans and movement queries are restricted to assigned sites', async t => {
    const originalFindOne = userModel.findOne
    const originalReservationFind = reservationModel.find
    const filters = []

    t.after(() => {
        userModel.findOne = originalFindOne
        reservationModel.find = originalReservationFind
    })

    userModel.findOne = () => managerQuery()
    reservationModel.find = filter => {
        filters.push(filter)
        return queryResult([])
    }

    await managerRepository.listOverdueLoans(managerId, new Date('2026-01-01T00:00:00Z'))
    await managerRepository.listManagerMovements(managerId)

    assert.equal(filters.length, 2)
    for (const filter of filters) {
        assert.deepEqual(filter.site.$in, [assignedSiteId])
        assert.ok(!filter.site.$in.includes(otherSiteId))
    }
    assert.equal(filters[0].status, 'checked_out')
    assert.deepEqual(filters[0].endDate, { $lt: new Date('2026-01-01T00:00:00Z') })
    assert.ok(Array.isArray(filters[1].$or))
})

test('user loan history is queried only by the authenticated user ID', async t => {
    const originalFind = reservationModel.find
    let filter

    t.after(() => {
        reservationModel.find = originalFind
    })

    reservationModel.find = query => {
        filter = query
        return queryResult([
            { status: 'checked_out' },
            { status: 'completed' },
            { status: 'approved' }
        ])
    }

    const loans = await userRepository.listUserReservations(managerId)

    assert.deepEqual(filter, { user: managerId })
    assert.equal(loans.length, 3)
})

test('site reassignment requires an admin identity', async t => {
    const originalServiceMethod = managerService.replaceManagerSites
    let serviceCalled = false

    t.after(() => {
        managerService.replaceManagerSites = originalServiceMethod
    })

    managerService.replaceManagerSites = async () => {
        serviceCalled = true
        return {}
    }

    for (const [user, expectedStatus] of [
        [null, 401],
        [{ _id: managerId, role: 'manager' }, 403],
        [{ _id: managerId, role: 'user' }, 403]
    ]) {
        const res = responseRecorder()
        await managerController.replaceSites(
            { user, params: { managerId }, body: { siteIds: [assignedSiteId] } },
            res,
            error => {
                throw error
            }
        )
        assert.equal(res.statusCode, expectedStatus)
    }

    assert.equal(serviceCalled, false)
})

test('admin assignment endpoint only allows admins and replaces requested sites', async t => {
    const originalReplace = managerService.replaceManagerSites
    let call

    t.after(() => {
        managerService.replaceManagerSites = originalReplace
    })

    managerService.replaceManagerSites = async (...args) => {
        call = args
        return { _id: managerId, assignedSites: args[1] }
    }

    for (const [user, expectedStatus] of [
        [null, 401],
        [{ _id: managerId, role: 'manager' }, 403],
        [{ _id: managerId, role: 'user' }, 403]
    ]) {
        const res = responseRecorder()
        await adminController.replaceManagerSites(
            { user, params: { managerId }, body: { siteIds: [assignedSiteId] } },
            res,
            error => {
                throw error
            }
        )
        assert.equal(res.statusCode, expectedStatus)
    }

    assert.equal(call, undefined)

    const res = responseRecorder()
    await adminController.replaceManagerSites(
        {
            user: { _id: otherSiteId, role: 'admin' },
            params: { managerId },
            body: { siteIds: [assignedSiteId, otherSiteId] }
        },
        res,
        error => {
            throw error
        }
    )

    assert.equal(res.statusCode, 200)
    assert.deepEqual(call, [managerId, [assignedSiteId, otherSiteId]])
})

test('admin overview rejects non-admin roles', async () => {
    for (const user of [{ _id: managerId, role: 'manager' }, { _id: managerId, role: 'user' }]) {
        const res = responseRecorder()
        await getOverview({ user }, res, error => {
            throw error
        })
        assert.equal(res.statusCode, 403)
    }
})

test('authenticated user cannot choose another account for loan history', async t => {
    const service = userService
    const originalGetMyLoans = service.getMyLoans
    let queriedUserId

    t.after(() => {
        service.getMyLoans = originalGetMyLoans
    })

    service.getMyLoans = async id => {
        queriedUserId = id
        return { inPossession: [], upcoming: [], history: [] }
    }

    const res = responseRecorder()
    await getMyLoans(
        {
            user: { _id: managerId },
            params: { userId: otherSiteId },
            query: { userId: otherSiteId },
            body: { userId: otherSiteId }
        },
        res,
        error => {
            throw error
        }
    )

    assert.equal(res.statusCode, 200)
    assert.equal(queriedUserId, managerId)
})

test('admin overview service is not called for unauthorized requests', async t => {
    const originalOverview = adminService.getOverview
    let called = false

    t.after(() => {
        adminService.getOverview = originalOverview
    })

    adminService.getOverview = async () => {
        called = true
        return {}
    }

    const res = responseRecorder()
    await getOverview(
        { user: { _id: managerId, role: 'manager' } },
        res,
        error => {
            throw error
        }
    )

    assert.equal(res.statusCode, 403)
    assert.equal(called, false)
})

test('active site catalog includes only active and available equipment', async t => {
    const originalSiteFind = siteModel.find
    const originalEquipmentFind = equipmentModel.find
    let siteFilter
    let equipmentFilter
    const site = {
        _id: assignedSiteId,
        name: 'Main store',
        toString() {
            return assignedSiteId
        }
    }

    t.after(() => {
        siteModel.find = originalSiteFind
        equipmentModel.find = originalEquipmentFind
    })

    siteModel.find = filter => {
        siteFilter = filter
        return queryResult([site])
    }
    equipmentModel.find = filter => {
        equipmentFilter = filter
        return queryResult([{
            _id: equipmentId,
            name: 'Drill',
            site: assignedSiteId
        }])
    }

    const result = await siteRepository.listActiveSitesWithEquipment()

    assert.deepEqual(siteFilter, { active: { $ne: false } })
    assert.deepEqual(equipmentFilter.site.$in, [assignedSiteId])
    assert.equal(equipmentFilter.active, true)
    assert.deepEqual(equipmentFilter.available, { $ne: false })
    assert.equal(result.length, 1)
    assert.equal(result[0].equipment[0].name, 'Drill')
})

test('GET /api/sites/active returns the active catalog', async t => {
    const originalList = siteService.listActiveSitesWithEquipment
    const expected = [{ _id: assignedSiteId, name: 'Main store', equipment: [] }]
    const server = app.listen(0)

    t.after(async () => {
        siteService.listActiveSitesWithEquipment = originalList
        await new Promise(resolve => server.close(resolve))
    })

    siteService.listActiveSitesWithEquipment = async () => expected
    await new Promise(resolve => server.once('listening', resolve))

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/sites/active`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), expected)
})

test('equipment list for a site only queries active sites and available equipment', async t => {
    const originalSiteFindOne = siteModel.findOne
    const originalEquipmentFind = equipmentModel.find
    let siteFilter
    let equipmentFilter

    t.after(() => {
        siteModel.findOne = originalSiteFindOne
        equipmentModel.find = originalEquipmentFind
    })

    siteModel.findOne = filter => {
        siteFilter = filter
        return {
            select() {
                return this
            },
            lean: async () => ({ _id: assignedSiteId })
        }
    }
    equipmentModel.find = filter => {
        equipmentFilter = filter
        return queryResult([{ _id: equipmentId, name: 'Drill' }])
    }

    const result = await siteService.listEquipmentForActiveSite(assignedSiteId)

    assert.deepEqual(siteFilter, {
        _id: assignedSiteId,
        active: { $ne: false }
    })
    assert.deepEqual(equipmentFilter, {
        site: assignedSiteId,
        active: true,
        available: { $ne: false }
    })
    assert.equal(result[0].name, 'Drill')
})

test('equipment list rejects invalid and inactive site IDs', async t => {
    const originalSiteFindOne = siteModel.findOne
    let queryCount = 0

    t.after(() => {
        siteModel.findOne = originalSiteFindOne
    })

    siteModel.findOne = () => {
        queryCount += 1
        return {
            select() {
                return this
            },
            lean: async () => null
        }
    }

    await assert.rejects(
        () => siteService.listEquipmentForActiveSite('invalid-id'),
        InvalidSiteIdError
    )
    await assert.rejects(
        () => siteService.listEquipmentForActiveSite(assignedSiteId),
        ActiveSiteNotFoundError
    )
    assert.equal(queryCount, 1)
})

test('GET /api/sites/:siteId/equipment returns equipment for the active site', async t => {
    const originalList = siteService.listEquipmentForActiveSite
    const expected = [{ _id: equipmentId, name: 'Drill' }]
    const server = app.listen(0)

    t.after(async () => {
        siteService.listEquipmentForActiveSite = originalList
        await new Promise(resolve => server.close(resolve))
    })

    siteService.listEquipmentForActiveSite = async siteId => {
        assert.equal(siteId, assignedSiteId)
        return expected
    }
    await new Promise(resolve => server.once('listening', resolve))

    const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api/sites/${assignedSiteId}/equipment`
    )
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), expected)
})

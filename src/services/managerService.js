'use strict'

import bcrypt from 'bcrypt'

import mongoose from 'mongoose'

import userRepository from '../repositories/userRepository.js'
import * as storeRepository from '../repositories/storeRepository.js'
import appError from '../utils/appError.js'


const toPublic = (user) => {
    const {
        password: _password,
        ...safeUser
    } = user.toObject()
    return safeUser
}


// the assignment store is mandatory, must exist and must be active
const getAssignableStore = async (storeId) => {

    if (!storeId) throw new appError('storeId is required for a manager.', 400)

    if (!mongoose.isValidObjectId(storeId)) throw new appError('Invalid store id.', 400)

    const store = await storeRepository.findStoreById(storeId)

    if (!store) throw new appError('Store not found.', 404)

    if (!store.active) throw new appError('This store is deactivated.', 409)

    return store
}


export const createManager = async function (data) {

    const name = typeof data ? .name === 'string' ? data.name.trim() : ''
    const email = typeof data ? .email === 'string' ? data.email.trim() : ''
    const password = data ?.password

    if (!name || !email || !password) {
        throw new appError('Name, email, password and storeId are required.', 400)
    }
    if (!email.includes('@')) throw new appError('Invalid email.', 400)

    if (typeof password !== 'string' || password.length < 8) {
        throw new appError('Password must contain at least 8 characters.', 400)
    }

    const store = await getAssignableStore(data.storeId)

    if (await userRepository.findUserByEmail(email)) {
        throw new appError('A user with this email already exists.', 409)
    }

    try {
        const manager = await userRepository.createUser({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            role: 'manager', // never read from the request body
            store: store._id
        })
        return toPublic(manager)
    } catch (err) {
        if (err.code === 11000) throw new appError('A user with this email already exists.', 409)
        throw err
    }
}


// one manager = one store ; several managers can share the same store
export const changeAssignment = async function (managerId, storeId) {

    if (!mongoose.isValidObjectId(managerId)) throw new appError('Invalid manager id.', 400)

    const manager = await userRepository.findUserById(managerId)

    if (!manager || manager.role !== 'manager') throw new appError('Manager not found.', 404)

    const store = await getAssignableStore(storeId)

    const updated = await userRepository.updateUser(managerId, {
        store: store._id
    })

    return toPublic(updated)
}
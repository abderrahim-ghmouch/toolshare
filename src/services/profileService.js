'use strict'

import bcrypt from 'bcrypt'

import userRepository from '../repositories/userRepository.js'
import appError from '../utils/appError.js'


// fields a user must never change on his own account
const FORBIDDEN_FIELDS = ['role', 'store', 'active', 'password', '_id', 'id']


const toPublic = (user) => {
    const {
        password: _password,
        ...safeUser
    } = user.toObject()
    return safeUser
}


export const getProfile = async function (actor) {

    const user = await userRepository.findUserById(actor.id)

    if (!user || user.active === false) throw new appError('Account not found or deactivated.', 401)

    return toPublic(user)
}


export const updateProfile = async function (actor, data) {

    if (!data || typeof data !== 'object') throw new appError('No data to update.', 400)

    if (FORBIDDEN_FIELDS.some((field) => field in data)) {
        throw new appError('You cannot change your role, store, status or password here.', 403)
    }

    const changes = {}

    if (data.name !== undefined) {
        const name = typeof data.name === 'string' ? data.name.trim() : ''
        if (!name) throw new appError('Name cannot be empty.', 400)
        changes.name = name
    }

    if (data.email !== undefined) {
        const email = typeof data.email === 'string' ? data.email.trim() : ''
        if (!email.includes('@')) throw new appError('Invalid email.', 400)

        const existing = await userRepository.findUserByEmail(email)
        if (existing && String(existing._id) !== String(actor.id)) {
            throw new appError('A user with this email already exists.', 409)
        }
        changes.email = email
    }

    if (Object.keys(changes).length === 0) throw new appError('No valid fields to update (name, email).', 400)

    try {
        const updated = await userRepository.updateUser(actor.id, changes)
        if (!updated) throw new appError('User not found.', 404)
        return toPublic(updated)
    } catch (err) {
        if (err.code === 11000) throw new appError('A user with this email already exists.', 409)
        throw err
    }
}


export const changePassword = async function (actor, data) {

    const oldPassword = data ? .oldPassword
    const newPassword = data ? .newPassword

    if (typeof oldPassword !== 'string' || !oldPassword) {
        throw new appError('oldPassword is required.', 400)
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        throw new appError('newPassword must contain at least 8 characters.', 400)
    }
    if (oldPassword === newPassword) {
        throw new appError('The new password must be different from the old one.', 400)
    }

    const user = await userRepository.findUserByIdWithPassword(actor.id)

    if (!user) throw new appError('User not found.', 404)

    if (!(await bcrypt.compare(oldPassword, user.password))) {
        throw new appError('Old password is incorrect.', 400)
    }

    await userRepository.updateUser(actor.id, {
        password: await bcrypt.hash(newPassword, 10)
    })
}
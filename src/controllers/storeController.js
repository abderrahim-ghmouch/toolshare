'use strict'

import mongoose from 'mongoose'

import * as storeRepository from '../repositories/storeRepository.js'

import userRepository from '../repositories/userRepository.js'

import appError from '../utils/appError.js'


const assertValidId = (id) => {

    if (!mongoose.isValidObjectId(id)) throw new appError('Invalid store id.', 400)
}


const assertUniqueName = async (name, ignoreId) => {

    const existing = await storeRepository.findStoreByName(name)

    if (existing && String(existing._id) !== String(ignoreId)) {

        throw new appError('A store with this name already exists.', 409)
    }
}


const getManagerStoreId = async (actor) => {

    const manager = await userRepository.findUserById(actor.id)

    if (!manager ? .store) {

        throw new appError('No store assigned to this manager.', 403)
    }
    return String(manager.store)
}


const getStoreOrFail = async (id) => {

    assertValidId(id)

    const store = await storeRepository.findStoreById(id)

    if (!store) throw new appError('Store not found.', 404)

    return store
}


export const listStores = async function (actor, filters = {}) {
    if (actor.role === 'admin') {
        // optional ?active=true or ?active=false
        const filter = {}
        if (filters.active !== undefined) filter.active = filters.active === 'true'
        return storeRepository.listStores(filter)
    }

    if (actor.role === 'manager') {
        const storeId = await getManagerStoreId(actor)
        const store = await storeRepository.findStoreById(storeId)
        return store ? [store] : []
    }

    // normal user: active stores only
    return storeRepository.listStores({
        active: true
    })
}


export const getStore = async function (actor, id) {

    const store = await getStoreOrFail(id)

    if (actor.role === 'admin') return store

    if (actor.role === 'manager') {
        if (String(store._id) !== await getManagerStoreId(actor)) {
            throw new appError('You can only access your own store.', 403)
        }
        return store
    }

    if (!store.active) throw new appError('Store not found.', 404)
    return store
}


export const createStore = async function (data) {
    const name = data.name
    const location = data.location
    const description = data.description

    if (!name || !location) {
        throw new appError('Name and location are required.', 400)
    }
    await assertUniqueName(name)

    try {
        return await storeRepository.createStore({
            name,
            location,
            description
        })
    } catch (err) {
        // two simultaneous requests with the same name: the unique index catches the second one
        if (err.code === 11000) throw new appError('A store with this name already exists.', 409)
        throw err
    }
}


export const updateStore = async function (id, data) {

    const store = await getStoreOrFail(id)

    const updates = {}
    for (const field of ['name', 'location', 'description']) {
        if (data ? . [field] !== undefined) updates[field] = String(data[field]).trim()
    }
    if (Object.keys(updates).length === 0) {
        throw new appError('No valid fields to update.', 400)
    }
    if ((updates.name !== undefined && !updates.name) || (updates.location !== undefined && !updates.location)) {
        throw new appError('Name and location cannot be empty.', 400)
    }

    if (updates.name && updates.name !== store.name) {
        await assertUniqueName(updates.name, id)
    }

    return storeRepository.updateStore(id, updates)
}


export const setStoreActive = async function (id, active) {

    await getStoreOrFail(id)

    return storeRepository.setStoreActive(id, active)
}
'use strict'

import * as storeRepository from '../repositories/storeRepository'

import userRepository from "../repositories/userRepository"

import appError from "../utils/appError"


const assertValidId = (id) => {

    if (!mongoose.Types.objectId(id)) throw new appError('Invalid store id.', 400)
}


const assertUniqueName = async (name, ignoreId) => {

    const existing = await storeRepository.findStoreByName(name)
    
    if (existing && String(existing._id) !== String(ignoreId)) {

        throw new appError('A store with this name already exists.', 409)
    }
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


const getManagerStoreId = async (actor) => {

    const manager = await userRepository.findUserById(actor.id)

    if (!manager?.store)
    {
        throw new appError('No store assigned to this manager.', 403)   
            
    }
        return String(manager.store)
}

export const createStore = async function (data) {
    const { name, location, description} =data

    if (!name || !location) {
        throw new appError('Name and location are required.', 400)
    }
    await assertUniqueName(name)

    return storeRepository.createStore({
        name,
        location,
        description
    })
}

export const updateStore = async function (id, data) {


assertValidId(id)

    const store = await storeRepository.findStoreById(id)
    
if (!store) throw new appError('Store not found.', 404)




 const updates = {}
 for (const field of ['name', 'location', 'description']) {
     if (data?.[field] !== undefined) updates[field] = data[field]
 }
 if (Object.keys(updates).length === 0) {
     throw new appError('No valid fields to update.', 400)
 }

 if (updates.name && updates.name !== store.name) {
     await assertUniqueName(updates.name, id)
 }

 return storeRepository.updateStore(id, updates)
}
 


export const getStore = async function (actor, id) {

    assertValidId(id)

    const store = await storeRepository.findStoreById(id)

    if (!store) {

        throw new appError('Store not found.', 404)
    }
    
        

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
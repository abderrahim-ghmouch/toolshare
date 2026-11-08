import storeModel from '../models/storeModel.js'

export const listStores  =async function(filter = {}) {
    return storeModel.find(filter)
}

export const findStoreById  =async function(id) {
    return storeModel.findById (id)
}

export const findStoreByName =async function(name) {
    return storeModel.findOne({
        name
    })
}

export  const createStore =async function(data) {
    return await  storeModel.create(data)
}

export const updateStore  =async function(id, data) {

    return await  storeModel.findByIdAndUpdate (id, data, {
        new: true,
        runValidators: true
    })
}

export const setStoreActive =async function (id, active) {
    return await  storeModel.findByIdAndUpdate (id, {
        $set: {
            active
        }
    }, {
        new: true
    })
}


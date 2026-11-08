'use strict'

import userModel from '../models/userModel.js'

export async function listUsers() {

    return userModel.find({})
}

export async function findUserById(id) {


    return userModel.findById(id)
}


export async function findUserByEmail(email, { withPassword = false} = {}) {
    const query = userModel.findOne({ email })
    
    return withPassword ? query.select('+password') : query
}



export async function createUser(userData) {
    return userModel.create(userData)
}

export async function deleteUser(id) {
    return userModel.findByIdAndDelete(id)
}


export async function updateUser(id, userData) {
    
        return userModel.findByIdAndUpdate(id, userData, {
        new: true,
        runValidators: true
    })
}


export async function userStats(id, active) {
        
        return userModel.findByIdAndUpdate(
        id,
        { $set: { active } },
        { new: true, runValidators: true }
    )
}

export default {
    listUsers,
    findUserById,
    findUserByEmail,
    createUser,
    deleteUser,
    updateUser,
    userStats
}

'use strict'

import bcrypt from 'bcrypt'

import userRepository from '../repositories/userRepository.js'

import jwt from 'jsonwebtoken'

import appError from '../utils/appError.js'


const createHttpError = (message, statusCode) => Object.assign(new Error(message), {
    statusCode
})

function ensureUserData(userData) {
    if (!userData || typeof userData !== 'object') {
        throw createHttpError('User data is required.', 400)
    }
    return {
        ...userData
    }
}


export const listUsers = async function () {


    return await userRepository.listUsers()
}

export async function getUser(id) {
    const user = await userRepository.findUserById(id)

    if (!user) {

        throw new appError('User not found.', 404)
    }

    return user
}


export const createUser = async function (userData) {
    const user = ensureUserData(userData)
    if (!user.name || !user.email || !user.password) {

        throw new appError('Name, email, and password are required.', 400)
    }
    const existingUser = await userRepository.findUserByEmail(user.email)
    if (existingUser) throw new appError('A user with this email already exists.', 409)

    user.password = await bcrypt.hash(user.password, 10)

    return userRepository.createUser(user)

}


export async function updateUser(id, userData) {
    const user = ensureUserData(userData)

    if (user.email) {
        const existingUser = await userRepository.findUserByEmail(user.email)

        if (existingUser && existingUser.id !== id) {

            throw new appError('user with this email already exists', 409)


        }
    }

    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10)
    }

    const updatedUser = await userRepository.updateUser(id, user)

    if (!updatedUser) {
        throw new appError('user not found', 404)
    }

    return updatedUser
}

export const deleteUser = async function (id) {

    const deletedUser = await userRepository.deleteUser(id)

    if (!deletedUser) {
        throw createHttpError('User not found', 404)
    }

    return deletedUser
}


export async function userStats(id, active = true) {

    if (typeof active !== 'boolean') {

        throw new appError('Active must be a boolean.', 400)
    }

    const updatedUser = await userRepository.userStats(id, active)

    if (!updatedUser) {
        throw new appError('User not found.', 404)
    }

    return updatedUser
}


export const login = async function login(email, password) {

    if (!email || !password) {

        throw new appError('email and password are required', 400)
    }

    const user = await userRepository.findUserByEmail(email, {
        withPassword: true
    })

  
    if (!user || !(await bcrypt.compare(password, user.password))) {

        throw new appError("invalid email or password", 401)
    } else if (user.active === false)

    {
        throw new appError('account is desactive', 403)
    }
    const token = jwt.sign({
    
        userId: user.id,
        
        role: user.role
    },
    process.env.JWT_SECRET, {
        
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
)

    const { password: _password, safeUser } = user.toObject()
    
return {token,user: safeUser}

}


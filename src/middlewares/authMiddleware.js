'use strict '

import appError from '../utils/appError.js'

import jwt from 'jsonwebtoken'

export const authMiddleware = async function (req, res, next) {

    try {
        const header = req.headers.authorization
        if (!header ?.startsWith('Bearer ')) throw new appError('Authentication required.', 401)

        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)

        req.user = {
            id: decoded.userId,
            role: decoded.role
        }
        next()
    } catch (err) {
        next(err.statusCode ? err : new appError('Invalid or expired token.', 401))
    }
}
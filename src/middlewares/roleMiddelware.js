'use strict'

import appError from '../utils/appError.js'

export const authorize = (...roles) => (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {


        return next(new appError('Access denied.', 403))
    }
    next()
}
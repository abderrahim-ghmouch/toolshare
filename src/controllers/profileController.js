import * as profileService from '../services/profileService.js'


export const getProfile = async function (req, res, next) {
    try {
        const user = await profileService.getProfile(req.user)
        return res.status(200).json({
            status: 'success',
            data: user
        })
    } catch (err) {
        next(err)
    }
}

export const updateProfile = async function (req, res, next) {
    try {
        const user = await profileService.updateProfile(req.user, req.body)
        return res.status(200).json({
            status: 'success',
            data: user
        })
    } catch (err) {
        next(err)
    }
}

export const changePassword = async function (req, res, next) {
    try {
        await profileService.changePassword(req.user, req.body)
        return res.status(200).json({
            status: 'success',
            message: 'Password updated.'
        })
    } catch (err) {
        next(err)
    }
}
import * as managerService from '../services/managerService.js'


export const createManager = async function (req, res, next) {
    try {
        const manager = await managerService.createManager(req.body)
        return res.status(201).json({
            status: 'success',
            data: manager
        })
    } catch (err) {
        next(err)
    }
}

export const changeAssignment = async function (req, res, next) {
    try {
        const manager = await managerService.changeAssignment(req.params.id, req.body ? .storeId)
        return res.status(200).json({
            status: 'success',
            data: manager
        })
    } catch (err) {
        next(err)
    }
}
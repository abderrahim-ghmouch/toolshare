'use strict'

import * as storeService from '../services/storeService.js'


export const listStores = async function (req, res, next) {
    try {
        const stores = await storeService.listStores(req.user, req.query)
        return res.status(200).json({ status: 'success', data: stores })
    } catch (err) {
        next(err)
    }
}


export const getStore = async function (req, res, next) {
    try {
        const store = await storeService.getStore(req.user, req.params.id)
        return res.status(200).json({ status: 'success', data: store })
    } catch (err) {
        next(err)
    }
}


export const createStore = async function (req, res, next) {
    try {
        const store = await storeService.createStore(req.body)
        return res.status(201).json({ status: 'success', data: store })
    } catch (err) {
        next(err)
    }
}


export const updateStore = async function (req, res, next) {
    try {
        const store = await storeService.updateStore(req.params.id, req.body)
        return res.status(200).json({ status: 'success', data: store })
    } catch (err) {
        next(err)
    }
}


export const deactivateStore = async function (req, res, next) {
    try {
        const store = await storeService.setStoreActive(req.params.id, false)
        return res.status(200).json({ status: 'success', data: store })
    } catch (err) {
        next(err)
    }
}


export const activateStore = async function (req, res, next) {
    try {
        const store = await storeService.setStoreActive(req.params.id, true)
        return res.status(200).json({ status: 'success', data: store })
    } catch (err) {
        next(err)
    }
}

'use strict'

import * as userService from '../services/userService.js'



export const login = async function (req, res, next) {
    
    const {email,password} =req.body 
    try {
    
        const {user} = await userService.login(email, password)
        
        if (user) {
          return res.status(200).json({  status: 'success',token,data:user})
        }
    } catch (error) {
        
        return next(error)
}



}
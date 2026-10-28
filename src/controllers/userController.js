import * as userService from '../services/userService.js'


export const listUsers = async function (req,res,next) {
    
    try {
    
        const users = await userService.listUsers()

        return res.status(200).json({ status: 'success', data:users})

    } catch (err)
    {

        next(err)
    }
}


export const createUser = async function (req,res,next) {
    
    try {

        const user = await userService.createUser(req.body)
        return res.status(201).json({status:'success',data:user})
    } catch (err) {
        
        next(err)
}

}

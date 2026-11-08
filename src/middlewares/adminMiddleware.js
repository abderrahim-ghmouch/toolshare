'use strict'

const adminMiddleware = async function (req,res,next) {
    
const userRole=req.user.role

    if (userRole!=='admin') {
        
        return res.status(403).json({
            message:'acces deinied'    

            })
    }
    else {
        next()
    }
    }

export default adminMiddleware
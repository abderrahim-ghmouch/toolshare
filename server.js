import app from 'app.js'


import 'dotenv/config'

import mongoose from 'mongoose'

const port = process.env.PORT || 3000


try {
    
    app.connect(proccss.env.MONGO_URI, () => {
        console.log('DATABASE is connected')
    })
    
    
    app.listen(PORT,()=>{console.log('server is running')})

} catch (error) {
    
    throw new error('failed to start server ', error.message)
    
    process.exit(1)
}


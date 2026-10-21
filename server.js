import app from 'app.js'


import 'dotenv/config'

import mongoose from 'mongoose'

const Port = process.env.PORT || 3000


try {
    
    mongoose.connect(proccss.env.MONGO_URI, () => {
        console.log('DATABASE is connected')
    })
    
    
    app.listen(Port,()=>{console.log('server is running')})

} catch (error) {
    
    throw new error('failed to start server ', error.message)
    
    process.exit(1)
}


import app from './app.js'
import 'dotenv/config'
import mongoose from 'mongoose'

const port = process.env.PORT || 3000

try {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is required')
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log('Database is connected')

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
} catch (error) {
    console.error('Failed to start server:', error)
    process.exitCode = 1
}

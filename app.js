import express from 'express'
import installationRoutes from './src/routes/installationRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import { errorHandler } from './src/middlewares/errorHandler.js'
import authRoutes from './src/routes/authRoutes'
const app = express()

app.use(express.json())

app.use(installationRoutes)

app.use(userRoutes)

app.use(authRoutes)
app.use(errorHandler)

export default app

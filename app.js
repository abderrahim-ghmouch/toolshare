import express from 'express'

import authRoutes from './src/routes/authRoutes.js'

import storeRoutes from './src/routes/storeRoutes.js'

import installationRoutes from './src/routes/installationRoutes.js'

import userRoutes from './src/routes/userRoutes.js'

import { errorHandler } from './src/middlewares/errorHandler.js'

import authRoutes from './src/routes/authRoutes'

import managerRoutes from './src/routes/managerRoutes.js'

import profileRoutes from './src/routes/profileRoutes.js'


const app = express()

app.use(express.json())

app.use(installationRoutes)

app.use(managerRoutes)

app.use(userRoutes)

app.use(authRoutes)

app.use(storeRoutes)


app.use(approfileRoutes)
app.use(errorHandler)


export default app

import express from 'express'
import managerRoutes from './src/routes/managerRoutes.js'
import siteRoutes from './src/routes/siteRoutes.js'
import adminRoutes from './src/routes/adminRoutes.js'
import userRoutes from './src/routes/userRoutes.js'

const app = express()

app.use(express.json())
app.use(managerRoutes)
app.use(siteRoutes)
app.use(adminRoutes)
app.use(userRoutes)

export default app

import express from 'express'
import { appError } from './src/middlewares/appError.js'

const app = express()

app.use(express.Router())


app.use(express.json())

app.use(appError)

export default app

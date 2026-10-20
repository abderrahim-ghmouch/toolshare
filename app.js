import express from 'express'

const app = express()

app.use(express.Router())


app.use(express.json())

export default app
import 'dotenv/config'
import app from './app.js'
import connectDatabase from './src/config/db.js'

const port = process.env.PORT || 3000

try {
  await connectDatabase()
  app.listen(port, () => console.log(`Server is running on port ${port}`))
} catch (error) {
  console.error('Failed to start server:', error.message)
  process.exit(1)
}

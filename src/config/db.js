import mongoose from 'mongoose'

const connectDatabase = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required')

  await mongoose.connect(process.env.MONGO_URI)
  console.log('Database connected')
}

export default connectDatabase

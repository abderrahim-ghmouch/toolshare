import bcrypt from 'bcrypt'
import { getStatus as findInstallation, installAdmin } from '../repositories/installationRepository.js'

export const getStatus = () => findInstallation()


export const install = async () => {
  
  const currentInstallation = await getStatus()
  if (currentInstallation) return currentInstallation


  const { ADMIN: name, ADMIN_EMAIL: email, PASSWORD: password } = process.env


  if (!name || !email || !password) {
    
    const error = Object.assign(new Error('ADMIN, ADMIN_EMAIL, and PASSWORD are required'), { statusCode: 400 })
    throw error
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  return installAdmin({ name, email, password: hashedPassword, role: 'admin' })
}

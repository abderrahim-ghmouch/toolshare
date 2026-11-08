import installationModel from '../models/installationModel.js'
import userModel from '../models/userModel.js'

export const getStatus = () => installationModel.findOne({ status: true })

export async function installAdmin(adminData) {
  const existingInstallation = await getStatus()
  if (existingInstallation) return existingInstallation

  await userModel.create(adminData)
  return installationModel.create({ status: true, installedAt: new Date() })
}

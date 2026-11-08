import { getStatus, install as runInstallation } from '../services/installationService.js'

export const status = async (req, res, next) => {
  try {
    const installation = await getStatus()
    res.status(200).json({ installed: Boolean(installation) })
  } catch (error) {
    next(error)
  }
}

export const install = async (req, res, next) => {
  try {
    const installation = await runInstallation()
    res.status(201).json({ status: 'success', data: installation })
  } catch (error) {
    next(error)
  }
}

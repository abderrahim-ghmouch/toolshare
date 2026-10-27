import {
    getStatus,
    installStatus,
    InstallationAlreadyCompletedError,
    InvalidInstallationDataError
} from "../services/installationService.js"

/** Return whether the application has completed its initial installation. */
export async function status(req, res, next) {
    try {
        const installation = await getStatus()

        return res.status(200).json(Boolean(installation?.status))
    } catch (error) {
        return next(error)
    }
}

/** Create the first administrator and mark the application as installed. */
export async function install(req, res, next) {
    try {
        const installation = await installStatus(req.body)

        return res.status(201).json({
            status: installation.status,
            installedAt: installation.installedAt
        })
    } catch (error) {
        if (error instanceof InvalidInstallationDataError) {
            return res.status(400).json({ message: error.message })
        }

        if (error instanceof InstallationAlreadyCompletedError) {
            return res.status(409).json({ message: error.message })
        }

        return next(error)
    }
}


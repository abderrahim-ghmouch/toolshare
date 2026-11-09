import siteService, {
    ActiveSiteNotFoundError,
    InvalidSiteIdError
} from '../services/siteService.js'

export async function listEquipment(req, res, next) {
    try {
        const equipment = await siteService.listEquipmentForActiveSite(req.params.siteId)
        return res.status(200).json(equipment)
    } catch (error) {
        if (error instanceof InvalidSiteIdError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ActiveSiteNotFoundError) {
            return res.status(404).json({ error: error.message })
        }

        return next(error)
    }
}

export async function listActive(req, res, next) {
    try {
        const sites = await siteService.listActiveSitesWithEquipment()

        return res.status(200).json(sites)
    } catch (error) {
        return next(error)
    }
}

export default { listActive, listEquipment }

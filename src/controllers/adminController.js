import adminService from '../services/adminService.js'
import managerService, {
    InvalidManagerAssignmentError,
    ManagerNotFoundError,
    SiteNotFoundError
} from '../services/managerService.js'

export async function getOverview(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' })
    }

    try {
        const overview = await adminService.getOverview()
        return res.status(200).json(overview)
    } catch (error) {
        return next(error)
    }
}

export async function replaceManagerSites(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Administrator access required' })
    }

    try {
        const manager = await managerService.replaceManagerSites(
            req.params.managerId,
            req.body?.siteIds
        )
        return res.status(200).json(manager)
    } catch (error) {
        if (error instanceof InvalidManagerAssignmentError) {
            return res.status(400).json({ error: error.message })
        }

        if (error instanceof ManagerNotFoundError || error instanceof SiteNotFoundError) {
            return res.status(404).json({ error: error.message })
        }

        return next(error)
    }
}

export default { getOverview, replaceManagerSites }

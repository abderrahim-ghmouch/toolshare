import equipmentModel from '../models/equipmentModel.js'
import siteModel from '../models/siteModel.js'

export async function listEquipmentForActiveSite(siteId) {
    const site = await siteModel.findOne({
        _id: siteId,
        active: { $ne: false }
    })
        .select('_id')
        .lean()

    if (!site) {
        return null
    }

    return equipmentModel.find({
        site: site._id,
        active: true,
        available: { $ne: false }
    })
        .select('_id reference name description site createdAt updatedAt')
        .sort({ name: 1 })
        .lean()
}

export async function listActiveSitesWithEquipment() {
    const sites = await siteModel.find({ active: { $ne: false } })
        .select('_id name createdAt updatedAt')
        .sort({ name: 1 })
        .lean()

    if (sites.length === 0) {
        return []
    }

    const equipment = await equipmentModel.find({
        site: { $in: sites.map(site => site._id) },
        active: true,
        available: { $ne: false }
    })
        .select('_id reference name description site createdAt updatedAt')
        .sort({ name: 1 })
        .lean()

    const equipmentBySite = new Map(sites.map(site => [site._id.toString(), []]))

    for (const item of equipment) {
        equipmentBySite.get(item.site.toString()).push(item)
    }

    return sites.map(site => ({
        ...site,
        equipment: equipmentBySite.get(site._id.toString())
    }))
}

export default { listEquipmentForActiveSite, listActiveSitesWithEquipment }

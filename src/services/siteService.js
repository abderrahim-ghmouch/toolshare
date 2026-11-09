import siteRepository from '../repositories/siteRepository.js'
import mongoose from 'mongoose'

export class InvalidSiteIdError extends Error {}
export class ActiveSiteNotFoundError extends Error {}

export async function listEquipmentForActiveSite(siteId) {
    if (typeof siteId !== 'string' || !mongoose.Types.ObjectId.isValid(siteId)) {
        throw new InvalidSiteIdError('Invalid site ID')
    }

    const equipment = await siteRepository.listEquipmentForActiveSite(
        new mongoose.Types.ObjectId(siteId).toString()
    )

    if (!equipment) {
        throw new ActiveSiteNotFoundError('Active site not found')
    }

    return equipment
}

export async function listActiveSitesWithEquipment() {
    return siteRepository.listActiveSitesWithEquipment()
}

export default { listEquipmentForActiveSite, listActiveSitesWithEquipment }

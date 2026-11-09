import equipmentModel from '../models/equipmentModel.js'
import reservationModel from '../models/reservationModel.js'
import siteModel from '../models/siteModel.js'

export async function getOverview() {
    const [sites, equipment, reservations] = await Promise.all([
        siteModel.find({})
            .select('_id name active createdAt updatedAt')
            .sort({ name: 1 })
            .lean(),
        equipmentModel.find({})
            .select('_id reference name description site active available createdAt updatedAt')
            .sort({ name: 1 })
            .populate('site', 'name')
            .lean(),
        reservationModel.find({})
            .select('_id user equipment site startDate endDate status handedOverAt handedOverBy returnCondition returnedAt returnedBy createdAt updatedAt')
            .sort({ startDate: -1 })
            .populate('user', 'name email')
            .populate('equipment', 'name')
            .populate('site', 'name')
            .populate('handedOverBy', 'name email')
            .populate('returnedBy', 'name email')
            .lean()
    ])

    return { sites, equipment, reservations }
}

export default { getOverview }

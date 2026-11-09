import reservationModel from '../models/reservationModel.js'

export async function listUserReservations(userId) {
    return reservationModel.find({ user: userId })
        .select('_id equipment site startDate endDate status handedOverAt handedOverBy returnedAt returnedBy returnCondition createdAt updatedAt')
        .sort({ startDate: -1 })
        .populate('equipment', 'name description')
        .populate('site', 'name')
        .populate('handedOverBy', 'name email')
        .populate('returnedBy', 'name email')
        .lean()
}

export default { listUserReservations }

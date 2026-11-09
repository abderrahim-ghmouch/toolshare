import mongoose from 'mongoose'

import userRepository from '../repositories/userRepository.js'

export class InvalidUserLoansQueryError extends Error {}

export async function getMyLoans(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new InvalidUserLoansQueryError('Invalid user ID')
    }

    const reservations = await userRepository.listUserReservations(userId)

    return {
        inPossession: reservations.filter(reservation => reservation.status === 'checked_out'),
        upcoming: reservations.filter(
            reservation => ['pending', 'approved'].includes(reservation.status)
        ),
        history: reservations.filter(
            reservation => ['completed', 'rejected', 'cancelled'].includes(reservation.status)
        )
    }
}

export default { getMyLoans }

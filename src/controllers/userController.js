import userService, { InvalidUserLoansQueryError } from '../services/userService.js'

export async function getMyLoans(req, res, next) {
    const userId = req.user?._id?.toString()

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    try {
        const loans = await userService.getMyLoans(userId)
        return res.status(200).json(loans)
    } catch (error) {
        if (error instanceof InvalidUserLoansQueryError) {
            return res.status(400).json({ error: error.message })
        }

        return next(error)
    }
}

export default { getMyLoans }

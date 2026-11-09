import adminRepository from '../repositories/adminRepository.js'

export async function getOverview() {
    return adminRepository.getOverview()
}

export default { getOverview }

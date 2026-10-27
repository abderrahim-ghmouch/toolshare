import bcrypt from "bcrypt"

import installationRepository from "../repositories/installationRepository.js"

export class InvalidInstallationDataError extends Error {}
export class InstallationAlreadyCompletedError extends Error {}


export async function getStatus() {

    return installationRepository.getStatus()
}

export async function installStatus(name, email, password) {
    



    const currentInstallation = await getStatus()
    
    if (currentInstallation)
    {
        
        console.log('already ')  
    }
    
        const hashPssword=bcrypt.hashPssword(password,10)

        const admin = await installAdmin({name,email,hashPssword})
    
    return admin 
    


}
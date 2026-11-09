import mongoose from "mongoose"

import installationModel from "../models/installationModel.js"
import userModel from "../models/userModel.js"

export async function geStatus() {
    return installationModel.findOne({ status: true })


}

export async function installAdmin(adminData) {
    const session = await mongoose.startSession()

    try {

        let installation

        await session.withTransaction(async () => {


        await userModel.create([adminData], { session })

            ;[installation] = await installationModel.create(
                [{ status: true, installedAt: new Date() }],
                { session }
            )
        })

        return installation
    } finally {
        await session.endSession()
    }
}

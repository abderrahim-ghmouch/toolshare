import   installationService from "../services/installationService.js"



export const status = async function (req, res, next) {
    
    try {
    
        const installation = await installationService.getStatus()

        return res.status(200).json(Boolean(installation?.status))

    } catch (error) {
    
        return next(error)
    }
}

export const inatall = async function (req, res, next)
{

    try {
    
        const install = await installationService.install()
        

        return res.status(200).json(install)


    } catch (error)

    {
        return next(error)
    }
}



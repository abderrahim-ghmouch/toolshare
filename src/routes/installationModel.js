import mongoose from 'mongoose'


const installationSchema = new mongoose.Schema({
    
        status:{
            
            type: Boolean,
            
            default: false
        }

}
    
)

const installationModel = mongoose.model('installation', installationSchema)


export default installationModel
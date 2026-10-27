import mongoose from "mongoose"

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        
        required: true,
        
    },
    email: {
        
        type: String,

        required: true,
        unique: true,
        
        trim: true,

        validate:{
            validator: function (value) {
                
            return  value.includes('@')

        }

}
    },
    
    password: {
        type: String,
        required: true,
        
    },

    role: {
        
        type: String,
        
        required: true,
        
        enum: ['admin', 'user','manager'],
        default :'user'
    }
})

const userModel = mongoose.model('user', userSchema)

export default userModel
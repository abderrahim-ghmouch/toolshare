import mongoose from 'mongoose'

const siteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

const siteModel = mongoose.model('site', siteSchema)

export default siteModel

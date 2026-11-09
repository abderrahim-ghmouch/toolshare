import mongoose from 'mongoose'

const equipmentSchema = new mongoose.Schema({
    reference: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'site',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    available: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

equipmentSchema.index({ site: 1, active: 1 })

const equipmentModel = mongoose.model('equipment', equipmentSchema)

export default equipmentModel

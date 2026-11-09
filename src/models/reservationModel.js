import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'equipment',
        required: true
    },
    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'site',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return !this.startDate || value > this.startDate
            },
            message: 'endDate must be later than startDate'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'checked_out'],
        default: 'pending',
        required: true
    },
    handedOverAt: {
        type: Date
    },
    handedOverBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    returnedAt: {
        type: Date
    },
    returnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    returnCondition: {
        type: String,
        enum: ['good', 'damaged']
    }
}, {
    timestamps: true
})

reservationSchema.index({ site: 1, startDate: 1, endDate: 1 })

const reservationModel = mongoose.model('reservation', reservationSchema)

export default reservationModel

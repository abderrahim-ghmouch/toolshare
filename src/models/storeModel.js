
import mongoose from 'mongoose'

const storeSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, 'Store name is required'],
        unique: true,
        trim: true
    },

    location: { // the company site where the store is, e.g. "Safi - Site 2"
        type: String,
        required: [true, 'Store location is required'],
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    active: {
        type: Boolean,
        default: true
    }

}
, {
    timestamps: true
})

const storeModel = mongoose.model('store', storeSchema)

export default storeModel
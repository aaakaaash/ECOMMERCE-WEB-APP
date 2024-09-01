const mongoose = require("mongoose")
const {Schema} = mongoose;

const addressSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref:"User",
        required : true,
    },
    house:{
        type: String,
        required :true
    },
    city: {
        type: String,
        required: true
    },
    stat: {
        type: String,
        required: true
    },
    landMark:{
        type: String,
        required: true 
    },
    pin:{
        type: Number,
        required: true
    },
    addressType: {
        type:String,
        required: true
    },
    ContactNo:{
        type: NUmber,
        required:true
    }
})

const Address = new mongoose("Address", addressSchema);

module.exports = Address;
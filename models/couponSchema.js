const mongoose = require("mongoose");
const {Schema}  = mongoose;

const couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true
    },
    image:{
        type:[String],
        required: true
    },
     minPurchaseAmount: {
        type:Number,
        required:true
     },
     maxPurchaseAmount:{
        type:Number,
        required:true
     },
     startDate:{
        type:Date,
        required:true
     },
     endDate:{
        type:Date,
        required:true
     },
     discountType:{
        type:String,
        required:true
     },
     discountValue:{
        type:Number,
        required:true
     },
     status:{
        type:String,
        required:true,
        enum:["Expired","Active","Used","Not available"]
    },
})

const Coupon = mongoose.model("Coupon",couponSchema);

module.exports = Coupon;
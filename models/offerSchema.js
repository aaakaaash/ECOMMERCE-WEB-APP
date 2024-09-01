const mongoose = require("mongoose");
const {Schema}  = mongoose;

const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    productId :{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },

     description:{
        type:String,
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
     
     discountValue:{
        type:Number,
        required:true
     },
     offerType:{
        type:String,
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
const mongoose = require("mongoose")
const {Schema} = mongoose;

const cartSchema = new mongoose.Schema({
    items:[{

        productId :{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        }
    }]
})

const Cart = mongoose.model("Cart",cartSchema);

module.exports = Cart;

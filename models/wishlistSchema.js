const mongoose = require("mongoose");
const {Schema} = mongoose;

const wishlistSchema = new mongoose.Schema({
    userId:{
        type:Schema.Types.Object,
        ref:"User",
        required:true
    },
    items:[{
    product_id:{
        type:Schema.Types.Object,
        ref:"Product"
    }
 }]
})

const Wishlist = mongoose.model("Wishlist",wishlistSchema)

module.exports = Wishlist;
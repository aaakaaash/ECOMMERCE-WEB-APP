const mongoose = require("mongoose");
const {Schema} = mongoose;

const wishlistSchema = new mongoose.Schema({
    items:[{
    product_id:{
        type:Schema.Types.Object,
        ref:"Product"
    }
 }]
})

const Wishlist = mongoose.model("Wishlist",wishlistSchema)

module.exports = Wishlist;
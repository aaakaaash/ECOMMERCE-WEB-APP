const mongoose = require("mongoose")
const {Schema} = mongoose;

const productSchema = new mongoose.Schema({
    productName : {
        type : String,
        required : true
    },
    sku : {
        type : String,
        required : true
    },
    categoryId : {
        type : Schema.Types.ObjectId,
        required : true
    },
    brand:{
        type : String,
        required : true
    },
    color:{
        type : String,
        required : true
    },
    price:{
        type : Number,
        required : true
    },
    quantity:{
        type : Number,
        default : true
    },
    description:{
        type : String,
        required : true
    },
    image:{
        type:[String],
        required: true
    },
    status:{
        type: String,
        enum:["Available","out of stock","Discountinued"],
        required:true,
        default:"Available"
    },
},{timestamps:true})


const Product = mongoose.model("Product", productSchema);

module.exports = Product;

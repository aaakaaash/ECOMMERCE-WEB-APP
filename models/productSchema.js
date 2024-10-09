const mongoose = require("mongoose");
const { Schema } = mongoose;
const {v4:uuidv4} = require("uuid");

const productSchema = new Schema({
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    skuNumber: {  
        type:String,
        default: ()=>uuidv4(),
        unique:true
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: "Brand",
        required: false,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
        required: true,
    },
    offerPrice: {
        type: Number,
        default: 0,
    },
    quantity: {
        type: Number,
        default: 0, 
    },
    color: {
        type: String,
        required: true,
    },
    productImage: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["Available", "out of stock"],
        required: true,
        default: "Available",
    },
    
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

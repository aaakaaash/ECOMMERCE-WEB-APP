const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const Offer = require("../../models/offerSchema")

const loadSingleProduct = async (req, res, next) => {
    try {
        let productId = req.params.productId.trim();

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid product ID');
        }
        
    
        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand') 
            .exec();
        
        if (!product) {
            return res.status(404).send('Product not found');
        }

        if (!product.category || !product.category.isListed) {
            return res.status(403).send('This product is under an unlisted category.');
        }

    
        const listedBrands = await Brand.find({ isListed: true }).select('_id').exec();
        const listedBrandIds = listedBrands.map(brand => brand._id.toString()); 
        
    
        if (!product.brand || !listedBrandIds.includes(product.brand._id.toString())) {
            return res.status(403).send('This product is under an unlisted brand.');
        }

        
        const relatedProducts = await Product.find({
            category: product.category._id,
            isBlocked: false,
            _id: { $ne: product._id } 
        })
        .limit(4) 
        .exec();

        
        const categories = await Category.find({}).exec();

    
        let userId = null;
        if (req.user) {
            userId = req.user;
        } else if (req.session.user) {
            userId = req.session.user;
        }

        
        const offer = await Offer.find().populate('category').populate('product').exec();

        let userData = null;
        if (userId) {
          userData = await User.findById(userId).populate("cart").exec();
        
          if (userData && userData.cart && !userData.cart.items) {
            userData.cart.items = [];
          }
        }
        
        res.locals.user = userData;

        
        res.render("single", { 
            user: userData,
            product: product,
            categories: categories,
            relatedProducts: relatedProducts, 
            offer
        });
    } catch (error) {
        console.log("Error loading product:", error);
        next(error);
    }
};




module.exports = {
    loadSingleProduct,
}



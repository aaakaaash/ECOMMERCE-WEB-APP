const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")



const loadSingleProduct = async (req, res, next) => {
    try {
        let productId = req.params.productId.trim();

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid product ID');
        }
        
        const product = await Product.findById(productId).exec();

        if (!product) {
            return res.status(404).send('Product not found');
        }

        let  userId = null;
        if(req.user){
            userId = req.user;
        }else if(req.session.user){
            userId = req.session.user;
        }
        let userData = null;
        
        if (userId) {
            userData = await User.findById(userId).exec();
            res.render("single", { 
                user: userData,
                product: product
            });
        } else {
            res.render("single", { 
                product: product
            });

        }
       
    } catch (error) {
        console.log("Error loading product:", error);
        next(error);
    }
};

module.exports = {
    loadSingleProduct
}



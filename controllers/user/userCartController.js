const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")


const cart = async (req,res,next) => {

    try {
        
        const userId = req.session.user || req.user;
        res.render("cart")


    } catch (error) {
        next(error)
    }

}




module.exports = {
    cart
}
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const mongoose = require("mongoose");

const env = require("dotenv").config();

const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Cart = require("../../models/CartSchema");
const { cart } = require("./userCartController");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema")
const Coupon = require("../../models/couponSchema")
const Wallet = require("../../models/walletSchema")
const razorpayInstance = require('../../config/razorpay'); 


const wallet = async (req, res, next) => {
    const userId = req.session.user || req.user;

    try {
        
        const user = await User.findById(userId).populate('wallet').exec();

        
        if (!user) {
            return res.status(404).send('User not found');
        }

      
        if (!user.wallet) {
            return res.render('wallet', {
                balance: 0, 
                transactions: []
            });
        }

    
        const { balance, transactions } = user.wallet;

        return res.render('wallet', {
            balance: balance,
            transactions: transactions
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    wallet
}

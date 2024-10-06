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

const checkWalletBalance = async (req, res) => {
    try {
      const { amount } = req.body;

      const userId = req.user.session || req.user;
  
      const user = await User.findById(userId).populate('wallet');
      if (!user || !user.wallet) {
        return res.json({ success: false, message: 'User or wallet not found' });
      }
  
      if (user.wallet.balance < amount) {
        return res.json({ success: false, message: 'Insufficient balance in wallet' });
      }
  
      return res.json({ success: true, message: 'Sufficient balance available' });
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while checking the wallet balance' });
    }
  };


module.exports = {
    wallet,
    checkWalletBalance
}

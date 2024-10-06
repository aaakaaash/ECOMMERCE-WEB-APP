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
const razorpayInstance = require('../../config/razorpay'); 
const Wallet =require("../../models/walletSchema")

const ReferralOffer = require('../../models/referralOfferSchema');
const Referral = require('../../models/referralSchema');


const applyReferralOffer = async (newUserId, referralCode) => {
  try {
    
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      console.log('Invalid referral code');
      return;
    }

    
    const currentDate = new Date();
    const activeOffer = await ReferralOffer.findOne({
      status: 'active',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });

    if (!activeOffer) {
      console.log('No active referral offer found');
      return;
    }


    const newReferral = new Referral({
      referrerUserId: referrer._id,
      refereeUserId: newUserId
    });
    await newReferral.save();

    
    await User.findByIdAndUpdate(referrer._id, {
      $push: { referrals: newReferral._id }
    });

    if (activeOffer.referrerReward > 0) {
      const referrerWallet = await Wallet.findOne({ user: referrer._id });
      if (referrerWallet) {
        referrerWallet.balance += activeOffer.referrerReward;
        await referrerWallet.save();
      }
    }

    const newUser = await User.findById(newUserId);
    if (activeOffer.walletCreditAmount > 0) {
      let newUserWallet = await Wallet.findOne({ user: newUserId });
      if (!newUserWallet) {
        newUserWallet = new Wallet({ user: newUserId, balance: 0 });
      }
      newUserWallet.balance += activeOffer.walletCreditAmount;
      await newUserWallet.save();
    }


    if (activeOffer.firstOrderDiscountPercentage > 0) {
      newUser.firstOrderDiscount = activeOffer.firstOrderDiscountPercentage;
      await newUser.save();
    }

    console.log('Referral offer applied successfully');

  } catch (error) {
    console.error('Error applying referral offer:', error);
  }
};


const applyFirstOrderDiscount = async (userId, orderTotal) => {
    try {
      const user = await User.findById(userId);
      if (user && user.firstOrderDiscount) {
        const discountAmount = (orderTotal * user.firstOrderDiscount) / 100;
        const discountedTotal = orderTotal - discountAmount;
        
    
        user.firstOrderDiscount = undefined;
        await user.save();
  
        return {
          originalTotal: orderTotal,
          discountPercentage: user.firstOrderDiscount,
          discountAmount: discountAmount,
          discountedTotal: discountedTotal
        };
      }
      return null;
    } catch (error) {
      console.error('Error applying first order discount:', error);
      return null;
    }
  };
  
  // In your checkout controller:
//   const processCheckout = async (req, res) => {
//     try {
//       const userId = req.user._id; // Assuming you have user info in req.user
//       const orderTotal = calculateOrderTotal(req.body.items); // Implement this function based on your needs
  
//       const discountResult = await applyFirstOrderDiscount(userId, orderTotal);
  
//       if (discountResult) {
//         // Apply the discount
//         // You might want to save this information with the order
//         res.render('checkout', { 
//           originalTotal: discountResult.originalTotal,
//           discountPercentage: discountResult.discountPercentage,
//           discountAmount: discountResult.discountAmount,
//           finalTotal: discountResult.discountedTotal
//         });
//       } else {
//         // No discount applied
//         res.render('checkout', { finalTotal: orderTotal });
//       }
//     } catch (error) {
//       console.error('Error processing checkout:', error);
//       res.status(500).send('An error occurred during checkout');
//     }
//   };

module.exports = { 
    applyReferralOffer,
    applyFirstOrderDiscount
 };
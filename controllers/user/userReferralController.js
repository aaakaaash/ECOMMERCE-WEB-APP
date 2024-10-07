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
          await creditWallet(referrer._id, activeOffer.referrerReward, 'Referral reward');
      } else if (activeOffer.walletCreditAmount > 0) {
          await creditWallet(referrer._id, activeOffer.walletCreditAmount, 'Referral wallet credit');
      }

      if (activeOffer.refereeReward > 0) {
          await creditWallet(newUserId, activeOffer.refereeReward, 'New user referral bonus');
      } else if (activeOffer.walletCreditAmount > 0) {
          await creditWallet(newUserId, activeOffer.walletCreditAmount, 'New user referral wallet credit');
      }


      if (activeOffer.firstOrderDiscountPercentage > 0) {
          await User.findByIdAndUpdate(newUserId, {
              firstOrderDiscount: activeOffer.firstOrderDiscountPercentage
          });
      }

      console.log('Referral offer applied successfully');

  } catch (error) {
      console.error('Error applying referral offer:', error);
  }
};


const creditWallet = async (userId, amount, description) => {
  try {
      const user = await User.findById(userId);
      if (!user || !user.wallet) {
          console.error('User or wallet not found');
          return;
      }

      await Wallet.findByIdAndUpdate(user.wallet, {
          $inc: { balance: amount },
          $push: {
              transactions: {
                  type: 'credit',
                  amount: amount,
                  description: description
              }
          }
      });
  } catch (error) {
      console.error('Error crediting wallet:', error);
  }
};

module.exports = { 
  applyReferralOffer, 
  creditWallet
 };
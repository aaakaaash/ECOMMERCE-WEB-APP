const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Coupon = require("../../models/couponSchema")

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp")



const coupon = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().exec();

    for (const coupon of coupons) {
      if (coupon.usedCount >= coupon.usageLimit && coupon.status !== "Not available") {
        coupon.status = "Not available";
        await coupon.save();
      }
    }

    return res.render("coupons", { coupons });
  } catch (error) {
    console.error('Error fetching or updating coupons:', error);
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    return res.render("create-coupon");
  } catch (error) {
    next(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      description,
      startDate,
      endDate,
      discountValue,
      status,
      minPurchaseAmount,
      maxPurchaseAmount,
      usageLimit
    } = req.body;

   
    const existingCoupon = await Coupon.findOne({ code: code });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists. Please try a different code."
      });
    }

    
    const newCoupon = new Coupon({
      code: code,
      discountType: discountType,
      description: description,
      startDate: startDate,
      endDate: endDate,
      discountValue: discountValue,
      status: status,
      minPurchaseAmount: minPurchaseAmount,
      maxPurchaseAmount: maxPurchaseAmount,
      usageLimit:usageLimit,
    });

  
    await newCoupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the coupon"
    });
  }
};

const deleteCoupon = async (req, res) => {
    try {

      const { couponId } = req.params;

      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found"
        });
      }
  
      
      await Coupon.findByIdAndDelete(couponId);
  
      res.status(200).json({
        success: true,
        message: "Coupon deleted successfully"
      });
  
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting the coupon"
      });
    }
  };
  

module.exports = {
  coupon,
  createCoupon,
  addCoupon,
  deleteCoupon
};
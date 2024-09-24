const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Coupon = require("../../models/couponSchema")

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp")


const coupon =  async (req,res,next) => {

const coupons = await Coupon.find().exec()

return res.render("coupons",{coupons})

}

const createCoupon = async (req,res,next) => {

    return res.render("create-coupon")


}

module.exports = {

    coupon,
    createCoupon

}
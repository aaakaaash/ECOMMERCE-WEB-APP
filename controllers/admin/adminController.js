const User = require("../../models/userSchema");
const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const express = require("express-session");

const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const moment = require('moment');


const pageerror =  (req,res)=>{
    res.render("admin-error")
}

const loadLogin = (req,res)=>{

    if(req.session.admin){
        return res.redirect("/admin/dashboard")
    }
    res.render("admin-login",{message:null})
}

const login = async (req, res, next)=>{
    try {
        const {email, password} = req.body;
        const admin = await User.findOne({email, role:"admin"});
        if(admin){

            const passwordMatch = bcrypt.compare(password, admin.password)
            if(passwordMatch) {
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            }else {
                return res.redirect("admin/login")
            }
        }else {
            return res.redirect("/admin/login")
        }
    } catch (error) {

        console.log("login error", error);
        next(error)
    }
}

const logout = async (req,res)=>{
    try {
        
        req.session.destroy(err =>{
            if(err){
                console.log("error destroying session",err);
                return res.redirect("/admin/pageerror")
            }
            res.redirect("/admin/login")
        })

    } catch (error) {
        console.log("unexpected error during logout",error);
        res.redirect("/admin/pageerror");
    }
}



const getCategorySalesData = async (startDate, endDate) => {
    const pipeline = [
        {
            $match: {
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        { $unwind: "$items" },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: "$productInfo" },
        {
            $group: {
                _id: "$productInfo.category",
                totalSales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        { $unwind: "$categoryInfo" },
        {
            $project: {
                category: "$categoryInfo.name",
                totalSales: 1
            }
        },
        { $sort: { totalSales: -1 } }
    ];

    try {
        const result = await Order.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error('Error in getCategorySalesData:', error);
        throw error;
    }
};

const getPaymentMethodsData = async (startDate, endDate) => {
    const pipeline = [
        {
            $match: {
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        { $unwind: "$payment" },
        {
            $group: {
                _id: "$payment.method",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ];

    try {
        const result = await Order.aggregate(pipeline);
        return result;
    } catch (error) {
        throw error;
    }
};

const getTopSellingItems = async (type, limit, startDate, endDate) => {
    
    let groupBy, lookupField, nameField;

    switch (type) {
        case 'product':
            groupBy = '$items.product';
            lookupField = 'products';
            nameField = 'productName';
            break;
        case 'category':
            groupBy = '$productInfo.category';
            lookupField = 'categories';
            nameField = 'name';
            break;
        case 'brand':
            groupBy = '$productInfo.brand';
            lookupField = 'brands';
            nameField = 'name';
            break;
    }

    const pipeline = [
        {
            $match: {
                date: { $gte: startDate, $lte: endDate }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        {
            $group: {
                _id: groupBy,
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: lookupField,
                localField: '_id',
                foreignField: '_id',
                as: 'details'
            }
        },
        { $unwind: '$details' },
        {
            $project: {
                _id: 1,
                totalQuantity: 1,
                totalRevenue: 1,
                name: `$details.${nameField}`
            }
        }
    ];

    try {
        const result = await Order.aggregate(pipeline);
        return result;
    } catch (error) {
        console.error(`Error in getting top selling ${type}:`, error);
        throw error;
    }
};

const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            const filter = req.query.filter || 'yearly';
            const customStartDate = req.query.startDate;
            const customEndDate = req.query.endDate;

            let startDate, endDate;
            const now = new Date();

            switch (filter) {
                case 'yearly':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                    break;
                case 'weekly':
                    startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                    endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                    endDate.setHours(23, 59, 59);
                    break;
                case 'daily':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    endDate = new Date(now.setHours(23, 59, 59, 999));
                    break;
                case 'custom':
                    startDate = new Date(customStartDate);
                    endDate = new Date(customEndDate);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            }

            const formatDate = (date) => {
                return date.toISOString().split('T')[0];
            };

            const categorySalesData = await getCategorySalesData(startDate, endDate);
            const paymentMethodsData = await getPaymentMethodsData(startDate, endDate);

            const topProducts = await getTopSellingItems('product', 10, startDate, endDate);
            const topCategories = await getTopSellingItems('category', 10, startDate, endDate);
            const topBrands = await getTopSellingItems('brand', 10, startDate, endDate);

            const chartData = {
                categorySalesData: categorySalesData.length ? categorySalesData : [{ category: 'No Data', totalSales: 0 }],
                paymentMethodsData: paymentMethodsData.length ? paymentMethodsData : [{ _id: 'No Data', count: 0 }],
            };

            res.render("dashboard", {
                ...chartData,
                topProducts,
                topCategories,
                topBrands,
                filter,
                customStartDate: formatDate(startDate),
                customEndDate: formatDate(endDate)
            });
        } catch (error) {
            console.log("Unexpected error during loading dashboard", error);
            res.status(500).send("An error occurred while loading the dashboard");
        }
    } else {
        res.redirect('/admin/login');
    }
};

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout
}

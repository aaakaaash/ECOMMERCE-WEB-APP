const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Cart = require("../../models/CartSchema");
const { cart } = require("./userCartController");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema")



const placeOrder = async (req, res, next) => {
    const userId = req.session.user || req.user;

    try {
        
        const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();

       
        const user = await User.findById(userId).populate('address').exec();

        
        const addresses = user.address || [];

        if (cart && cart.items.length > 0) {
            const total = cart.items.reduce((acc, item) => {
                return acc + item.product.salePrice * item.quantity;
            }, 0);

            cart.total = total;
        }

        if (cart && cart.items.length > 0){
        res.render("checkout-page", { cart, addresses });
        }else
        {
            res.status(400).json({ message: "Your cart is empty. Please add items to your cart before proceeding." });
        }

    } catch (error) {
        next(error);
    }
};

const loadPayment = async (req, res, next) => {
    try {
        const { userId, address } = req.body;

    
        const user = await User.findById(userId);
        const selectedAddress = await Address.findById(address);
        const cart = await Cart.findOne({ userId: userId }).populate('items.product');


        if (!user || !selectedAddress || !cart) {
            return res.status(400).json({ message: 'Invalid user, address, or cart information.' });
        }

       
        let totalPrice = 0;
        const items = cart.items.map(item => {
            totalPrice += item.product.salePrice * item.quantity;
            return {
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.salePrice,
            };
        });

       
        res.render('payment-page', {
            user,
            address: selectedAddress,
            items,
            totalPrice,
        });

    } catch (error) {
        console.error('Error loading payment page:', error);
        return next(error);
    }
};


const confirmOrder = async (req, res, next) => {
    try {
        const { userId, address, items, totalPrice } = req.body;
       
        const parsedItems = items.map(item => JSON.parse(item));
       
        const order = new Order({
            user: userId,
            address: address,
            items: parsedItems,
            actualPrice: totalPrice,
            offerPrice: totalPrice,
            status: 'Processing',
            totalPrice: totalPrice,
        });

        await order.save();

        const cart = await Cart.findOne({ userId: userId });
        cart.items = [];
        await cart.save();

        return res.redirect('/user/order-confirmation');

    } catch (error) {
        console.error('Error confirming order:', error);
        return next(error);
    }
};

const orderConfirmationPage = async (req,res,next) => {

try {
    
res.render("order-confirmation")


} catch (error) {
    next(error)
}

}



module.exports = {
    placeOrder,
    loadPayment,
    confirmOrder,
    orderConfirmationPage
}
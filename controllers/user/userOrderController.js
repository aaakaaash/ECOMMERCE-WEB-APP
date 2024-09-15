const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Cart = require("../../models/CartSchema");
const { cart } = require("./userCartController");
const Address = require("../../models/addressSchema");



const placeOrder = async (req, res, next) => {
    const userId = req.session.user || req.user;

    try {
        // Fetch the cart for the user and populate product details
        const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();

        // Fetch user and populate the address field
        const user = await User.findById(userId).populate('address').exec();

        // If user has addresses, use them; otherwise, handle no addresses scenario
        const addresses = user.address || [];

        if (cart && cart.items.length > 0) {
            const total = cart.items.reduce((acc, item) => {
                return acc + item.product.salePrice * item.quantity;
            }, 0);

            cart.total = total;
        }

        // Render the checkout page with cart and addresses
        res.render("checkout-page", { cart, addresses });

    } catch (error) {
        next(error);
    }
};

const loadPayment = async (req, res, next) => {
    try {
        const { userId, address } = req.body;

        // Retrieve the user, address, and cart details
        const user = await User.findById(userId);
        const selectedAddress = await Address.findById(address);
        const cart = await Cart.findOne({ userId: userId }).populate('items.product');

        if (!user || !selectedAddress || !cart) {
            return res.status(400).json({ message: 'Invalid user, address, or cart information.' });
        }

        // Calculate total price
        let totalPrice = 0;
        const items = cart.items.map(item => {
            totalPrice += item.product.salePrice * item.quantity;
            return {
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.salePrice,
            };
        });

        // Create a new order
        const newOrder = new Order({
            user: user._id,
            address: selectedAddress._id,
            items: items,
            actualPrice: totalPrice,
            offerPrice: totalPrice,
            status: 'Pending',
            totalPrice: totalPrice,
        });

        // Save the order
        await newOrder.save();


        cart.items = [];
        await cart.save();

      
        return res.render('payment-page');

    } catch (error) {
        console.error('Error placing order:', error);
        return next(error);
    }
};


module.exports = {
    placeOrder,
    loadPayment
}
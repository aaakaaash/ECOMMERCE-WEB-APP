const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Cart = require("../../models/CartSchema");


const cart = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        console.log("User ID:", userId);
        
        const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();
        
        console.log("Cart:", JSON.stringify(cart, null, 2));
        console.log("Cart items length:", cart ? cart.items.length : 'Cart not found');
        
        if (cart && cart.items.length > 0) {
            console.log("First item in cart:", JSON.stringify(cart.items[0], null, 2));
        }


        console.log("Cart:", cart); 

        let totalPrice = 0;
        let totalItems = 0;
        const discount = 200; 
        const platformFee = 50; 
        const deliveryCharges = 40; 

        if (cart && cart.items.length > 0) {
            cart.items.forEach(item => {
                totalPrice += item.price * item.quantity;
                totalItems += item.quantity;
            });
        }

        const totalAmount = totalPrice - discount + platformFee + deliveryCharges;

        res.render("cart", { cart, totalItems, totalPrice, discount, platformFee, deliveryCharges, totalAmount });
    } catch (error) {
        console.error("Error in fetching cart:", error);
        next(error);
    }
};



const addToCart = async (req, res, next) => {
    try {
    
        const userId = req.session.user || req.user;
        

        if (!userId) {
            return res.status(401).json({ error: 'Please login to add items to cart' });
        }

        const { productId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(productId).exec();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId: userId }).populate('items.product');
       
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);

        if (existingItemIndex > -1) {
            return res.status(200).json({ message: 'Item already in cart', cartItemsCount: cart.items.length });
        } else {
            cart.items.push({
                product: product._id,
                quantity: quantity,
                price: product.salePrice
            });
        }

       
        await cart.save();

        await User.findByIdAndUpdate(userId, { cart: cart._id });

        res.json({ message: 'Item added to cart successfully', cartItemsCount: cart.items.length });
        
    } catch (error) {
        next(error);
    }
};

const updateQuantity = async (req,res, next) => {

    const {productId, change} = req.body;
    const userId = req.session.user || req.user;

    try {

        let cart = await Cart.findOne({ userId });
        const item = cart.items.find(item => item.product.toString() === productId);

        if (item) {
            item.quantity += change;
            if (item.quantity < 1) item.quantity = 1; 
            await cart.save();
        }

        res.json({ success: true });
        
    } catch (error) {
        next(error)
    }

}



const removeFromCart = async (req, res) => {
    const { productId } = req.body; 
    const userId = req.session.user || req.user; 


    if (!userId) {
        return res.status(401).json({ success: false, message: 'Please login to remove items from cart' });
    }

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }


        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        await cart.save();

        res.json({ success: true, message: 'Item removed from cart successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};




module.exports = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart
    
    
}
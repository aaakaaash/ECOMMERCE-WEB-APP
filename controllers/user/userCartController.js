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
        
    
        const page = parseInt(req.query.page) || 1;
        const limit = 2; 
        const skip = (page - 1) * limit;
        
        const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();

        if (cart.items.isBlocked) {
            return res.status(400).json({ error: 'Product is blocked' });
        }

        let totalPrice = 0;
        let totalItems = 0;
        const discount = 0; 
        const platformFee = 0; 
        const deliveryCharges = 0; 
        let distinctProductCount = 0; 

        if (cart && cart.items.length > 0) {
            const distinctProducts = new Set(); 
            cart.items.forEach(item => {
                totalPrice += item.price * item.quantity;
                totalItems += item.quantity;

                distinctProducts.add(item.product._id.toString()); 
               

            });
              distinctProductCount = distinctProducts.size;
        }

    
        const totalCartItems = cart ? cart.items.length : 0;
        const paginatedItems = cart ? cart.items.slice(skip, skip + limit) : [];
        const totalPages = Math.ceil(totalCartItems / limit);

        const totalAmount = totalPrice - discount + platformFee + deliveryCharges;

        
        res.render("cart", { 
            cart: { ...cart, items: paginatedItems }, 
            totalItems, 
            totalPrice, 
            discount, 
            platformFee, 
            deliveryCharges, 
            totalAmount,
            distinctProductCount,
            currentPage: page,
            totalPages: totalPages,
            totalCartItems: totalCartItems 
        });
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

        if (product.quantity === 0) {
            return res.status(400).json({ error: 'Product is out of stock' });
        }

        if (product.isBlocked) {
            return res.status(400).json({ error: 'Product is blocked' });
        }

        if (quantity > product.quantity) {
            return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
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

            
            await Product.findByIdAndUpdate(productId, {
                $inc: { quantity: -1 },
                $set: { status: (product.quantity - quantity <= 0) ? "Out of stock" : product.status }
            });
        }

        await cart.save();

        await User.findByIdAndUpdate(userId, { cart: cart._id });

        res.json({ message: 'Item added to cart successfully', cartItemsCount: cart.items.length });

    } catch (error) {
        next(error);
    }
};



const MAX_QUANTITY_PER_PRODUCT = 5;

const updateQuantity = async (req, res, next) => {
    const { productId, change } = req.body;
    const userId = req.session.user || req.user;

    try {
        
        let cart = await Cart.findOne({ userId }).populate('items.product');
        
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }


      
        const item = cart.items.find(item => item.product._id.toString() === productId);

        
        if (item.isBlocked) {
            return res.status(400).json({ error: 'Product is blocked' });
        }

        if (item) {
            
            let newQuantity = item.quantity + change;

           
            if (newQuantity < 1) {
                newQuantity = 1;
                return res.status(400).json({ error: 'Minimum quantity is 1. If you want to remove the item, use the remove button.' });
            }

           
            if (newQuantity > MAX_QUANTITY_PER_PRODUCT) {
                return res.status(400).json({ error: `You can only have up to ${MAX_QUANTITY_PER_PRODUCT} units of this product` });
            }

            
            item.quantity = newQuantity;

            
            const quantityDifference = change;

           
            await Product.findByIdAndUpdate(productId, {
                $inc: { quantity: -quantityDifference }
            });

            
            await cart.save();

            res.json({ success: true, updatedQuantity: item.quantity });
        } else {
            res.status(404).json({ error: 'Item not found in cart' });
        }
        
    } catch (error) {
        next(error);
    }
};



const removeFromCart = async (req, res) => {
    const { productId } = req.body; 
    const userId = req.session.user || req.user; 

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Please login to remove items from cart' });
    }

    try {
        let cart = await Cart.findOne({ userId }).populate('items.product');

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        
        const itemToRemove = cart.items.find(item => item.product._id.toString() === productId);

        if (!itemToRemove) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        
        cart.items = cart.items.filter(item => item.product._id.toString() !== productId);

      
        await Product.findByIdAndUpdate(productId, {
            $inc: { quantity: itemToRemove.quantity },
            $set: { status: "Available" }
        });

        
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
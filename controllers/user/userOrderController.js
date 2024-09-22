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
          const distinctProducts = new Set(cart.items.map(item => item.product._id.toString()));
          const distinctProductCount = distinctProducts.size;

          cart.discount = cart.discount || 0;
          cart.platformFee = cart.platformFee || 0;
          cart.deliveryCharges = cart.deliveryCharges || 0;

         
          cart.total = cart.items.reduce((acc, item) => {
              return acc + (item.product.salePrice || 0) * item.quantity;
          }, 0);

          res.render("checkout-Page", { 
              cart, 
              addresses,
              distinctProductCount
          });
      } else {
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
      const { userId, address, items, totalPrice, paymentMethod } = req.body;

      const parsedItems = items.map(item => JSON.parse(item));

      const order = new Order({
          user: userId,
          address: address,
          items: parsedItems,
          actualPrice: totalPrice,
          offerPrice: totalPrice,
          status: 'Processing',
          totalPrice: totalPrice,
          payment: [{
              method: paymentMethod || "Cash On Delivery", 
              status: "not done"
          }]
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

const myOrder = async (req, res, next) => {
    try {
      const userId = req.session.user || req.user;
      const searchQuery = req.query.searchQuery || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 3;
      const skip = (page - 1) * limit;
  
      let searchCondition = { user: userId };
  

     /* if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i');
        searchCondition.$or = [
          { orderNumber: regex },
          { status: regex }
        ];
      }  */

  
      const totalOrders = await Order.countDocuments(searchCondition);
      const totalPages = Math.ceil(totalOrders / limit);
  
      
      let orders = await Order.find(searchCondition)
        .populate({
          path: 'items.product',
          select: 'productName description color salePrice skuNumber productImage'
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
  
      
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i');
        orders = orders.filter(order =>
          order.items.some(item =>
            item.product &&
            (
              regex.test(item.product.productName) 
            )
          )
        );
      }
  
      
      orders = orders.map(order => {
        order.items = order.items.map(item => {
          if (!item.product) {
            item.product = {
              productName: 'Product Deleted',
              productImage: ['placeholder.jpeg'],
              salePrice: item.price,
              sku: 'N/A',
              description: 'This product has been removed from our catalog.',
              color: 'N/A'
            };
          }
          return item;
        });
        return order;
      });
  
      
      res.render("my-order", {
        orders,
        currentPage: page,
        totalPages,
        totalOrders,
        searchQuery,
        noResults: orders.length === 0
      });
    } catch (error) {
      
      next(error);
    }
  };
  

  const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            { status: "Cancelled" },
            { new: true }
        );

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const products = order.items.map(item => ({
            productId: item.product._id.toString(),
            quantity: item.quantity

        }));
       
        for (const product of products) {
            await Product.findOneAndUpdate(
                { _id: product.productId },  
                { $inc: { quantity: product.quantity } },  
                { new: true }  
            );
        }

     
        res.redirect('/user/my-order');

    } catch (error) {
        next(error);
    }
};

const orderDetails = async (req, res, next) => {
  try {
    const { orderId, productId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate('user')
      .populate('address')
      .populate('items.product')
      .exec();

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const selectedItem = order.items.find(item => item.product._id.toString() === productId);

    if (!selectedItem) {
      return res.status(404).send('Product not found in order');
    }

    console.log('Selected Item:', JSON.stringify(selectedItem, null, 2));

    return res.render('order-details-page', { order, selectedItem });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return next(error);
  }
};



module.exports = {
    placeOrder,
    loadPayment,
    confirmOrder,
    orderConfirmationPage,
    myOrder,
    cancelOrder,
    orderDetails
}
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
const Coupon = require("../../models/couponSchema")
const razorpayInstance = require('../../config/razorpay'); 

const placeOrder = async (req, res, next) => {
  const userId = req.session.user || req.user;

  try {
      const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();
      const user = await User.findById(userId).populate('address').exec();
      const coupons = await Coupon.find().exec();
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
              distinctProductCount,
              coupons
          });
      } else {
          res.status(400).json({ message: "Your cart is empty. Please add items to your cart before proceeding." });
      }
  } catch (error) {
      next(error);
  }
};



const addCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.body;
    const userId = req.session.user || req.user;
    const cart = await Cart.findOne({ userId: userId }).populate('items.product').exec();
    const coupon = await Coupon.findById(couponId);
    const usedCoupon = await Order.findOne({ user: userId, coupon: couponId });

    if (usedCoupon) {
      return res.status(400).json({ message: "Coupon has already been used. Please try another one." });
    }

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

   
    const cartTotal = cart.items.reduce((total, item) => {
      return total + (item.product.salePrice * item.quantity);
    }, 0);

    
    if (cartTotal < coupon.minPurchaseAmount || cartTotal > coupon.maxPurchaseAmount) {
      return res.status(400).json({ message: "Coupon is not applicable for this order amount" });
    }

    if (coupon.status === "Not available") {
      return res.status(400).json({ message: "Coupon is no longer available." });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit exceeded" });
    }

    if (new Date() < coupon.startDate || new Date() > coupon.endDate) {
      return res.status(400).json({ message: "Coupon is not active" });
    }

   
    let discountAmount = 0;
    if (coupon.discountType === "fixed") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    }

    
    discountAmount = Math.min(discountAmount, cartTotal);

    
    const platformFee = cart.platformFee || 0;
    const deliveryCharges = cart.deliveryCharges || 0;

    
    const newTotal = cartTotal - discountAmount + platformFee + deliveryCharges;

    
    const updatedPriceDetails = {
      subtotal: cartTotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      deliveryCharges: deliveryCharges.toFixed(2),
      total: newTotal.toFixed(2),
      couponCode: coupon.code,
      couponId: coupon._id
    };

    res.status(200).json(updatedPriceDetails);

  } catch (error) {
    console.error('Error in addCoupon:', error);
    res.status(500).json({ message: "An error occurred while applying the coupon" });
    next(error)
  }
};


const loadPayment = async (req, res, next) => {
  try {
      const { userId, address, appliedCouponId } = req.body;

      const user = await User.findById(userId);
      const selectedAddress = await Address.findById(address);
      const cart = await Cart.findOne({ userId: userId }).populate('items.product');
      let appliedCoupon = null;

      if (appliedCouponId) {
          appliedCoupon = await Coupon.findById(appliedCouponId);
      }

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

      let discountAmount = 0;
      if (appliedCoupon) {
          if (appliedCoupon.discountType === "fixed") {
              discountAmount = appliedCoupon.discountValue;
          } else if (appliedCoupon.discountType === "percentage") {
              discountAmount = (totalPrice * appliedCoupon.discountValue) / 100;
          }
          totalPrice -= discountAmount;
      }

      res.render('payment-page', {
          user,
          address: selectedAddress,
          items,
          totalPrice,
          appliedCoupon,
          discountAmount
      });

  } catch (error) {
      console.error('Error loading payment page:', error);
      return next(error);
  }
};


const confirmOrder = async (req, res, next) => {
  try {
      const { userId, address, items, totalPrice, appliedCouponId, discountAmount, paymentMethod } = req.body;
      const parsedItems = items.map(item => JSON.parse(item));

      const orderData = {
          user: userId,
          address: address,
          items: parsedItems,
          actualPrice: totalPrice + discountAmount,
          offerPrice: totalPrice,
          coupon: appliedCouponId || undefined,
          discount: discountAmount,
          status: 'Processing',
          totalPrice: totalPrice,
          payment: [{
              method: paymentMethod === "OnlinePayment" ? "online payment" : "Cash On Delivery",
              status: paymentMethod === "OnlinePayment" ? "pending" : "completed"
          }]
      };

      const order = new Order(orderData);
      await order.save();

      if (paymentMethod === "OnlinePayment") {
          const razorpayOptions = {
              amount: totalPrice * 100,
              currency: "INR",
              receipt: `order_rcptid_${order._id}`
          };

          const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);

          order.payment[0].razorpayOrderId = razorpayOrder.id;
          await order.save();

          return res.redirect(`/user/payment/razorpay-checkout?orderId=${order._id}&razorpayOrderId=${razorpayOrder.id}`);
      } else {
          // Cash on Delivery
          await finalizeOrder(order, userId, appliedCouponId);
          return res.redirect('/user/order-confirmation');
      }
  } catch (error) {
      console.error('Error confirming order:', error);
      return next(error);
  }
};

// Helper function to finalize the order
const finalizeOrder = async (order, userId, appliedCouponId) => {
  // Clear the cart
  const cart = await Cart.findOne({ userId: userId });
  console.log(cart)
  if (cart) {
      cart.items = [];
      await cart.save();
  }

  // Update coupon usage
  if (appliedCouponId) {
      const couponData = await Coupon.findById(appliedCouponId);
      if (couponData) {
          couponData.usedCount = (couponData.usedCount || 0) + 1;
          if (couponData.usedCount >= couponData.usageLimit && couponData.status !== "Not available") {
              couponData.status = "Not available";
          }
          await couponData.save();
      }
  }

  // Update order status
  order.status = 'Processing';
  await order.save();
};


const razorpayCheckout = async (req, res, next) => {
  try {
      const { orderId, razorpayOrderId } = req.query;
      
      const order = await Order.findById(orderId).populate('user');
      
      if (!order) {
          return res.status(404).send('Order not found');
      }

      if (!order.user) {
          return res.status(404).send('User not found for this order');
      }

      res.render('razorpay-checkout', {
          orderId: orderId,
          razorpayOrderId: razorpayOrderId,
          razorpayKeyId: process.env.RAZOR_PAY_KEY_ID,
          totalPrice: order.totalPrice,
          user: {
              name: order.user.name,
              email: order.user.email,
              contact: order.user.phone
          }
      });
  } catch (error) {
      next(error);
  }
};


// New function to handle Razorpay payment verification
const verifyRazorpayPayment = async (req, res, next) => {
  try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const order = await Order.findOne({ 'payment.razorpayOrderId': razorpay_order_id });

      if (!order) {
          return res.status(404).send('Order not found');
      }

      const isValid = validateRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (isValid) {
          order.payment[0].status = 'completed';
          order.payment[0].razorpayPaymentId = razorpay_payment_id;
          await finalizeOrder(order, order.user, order.coupon);
          return res.redirect('/user/order-confirmation');
      } else {
          order.status = 'Failed';
          order.payment[0].status = 'failed';
          await order.save();
          return res.redirect("/cart/place-order/make-payment");
      }
  } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      return next(error);
  }
};

// Helper function to validate Razorpay signature
const validateRazorpaySignature = (orderId, paymentId, signature) => {
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${orderId}|${paymentId}`);
  const digest = shasum.digest('hex');
  return digest === signature;
};



const orderConfirmationPage = async (req,res,next) => {

try {
    
return res.render("order-confirmation");


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

   

    return res.render('order-details-page', { order, selectedItem });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return next(error);
  }
};



module.exports = {
    placeOrder,
    addCoupon,
    loadPayment,
    confirmOrder,
    orderConfirmationPage,
    myOrder,
    cancelOrder,
    orderDetails,
    verifyRazorpayPayment,
    razorpayCheckout,
   
}

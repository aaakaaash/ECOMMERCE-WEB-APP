const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    default: () => uuidv4().split('-')[0],
    unique: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  address: {
    type: Schema.Types.ObjectId,
    ref: "Address",
    required: true
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref:'Coupon',
    required:false
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      default: 0
    }
  }],
  actualPrice: {
    type: Number,
    required: true
  },
  offerPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"]
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  payment: [{
    method: {
      type: String,
      required: true,
      enum: ["Cash On Delivery", "online payment"]
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed"]
    },
    razorpayOrderId: {
      type: String,
      required: false  
    }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ["Retail", "Wholesale", "Subscription"]
  },
  shippingMethod: {
    type: String,
    enum: ["Standard", "Express", "Free Shipping"]
  },
  trackingNumber: {
    type: String
  },
  cancelReason: {
    type: String
  }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
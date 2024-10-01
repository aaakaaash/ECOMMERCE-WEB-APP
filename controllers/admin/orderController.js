const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema");


const fs = require("fs");


const orders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        let query = {};

        if (searchQuery) {
            query = {
                $or: [
                    { orderId: { $regex: searchQuery, $options: 'i' } },
                    { status: { $regex: searchQuery, $options: 'i' } },
                    { 'payment.method': { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'user',
                select: 'username email', 
                options: { lean: true }
            })
            .populate('items.product', 'productName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render("customers-order", {
            orders,
            currentPage: page,
            totalPages,
            searchQuery
        });
    } catch (error) {
       
        res.status(500).render('error', { message: 'An error occurred while fetching orders' });
    }
};

const updateOrderStatus = async (req, res) => {
    
    try {
        const { id } = req.params; 
        const { status, itemId, cancelReason } = req.body; 

        if (!id || !status || !itemId) {
            return res.status(400).json({ success: false, message: 'Order ID, item ID, and status are required' });
        }

        const order = await Order.findById(id).populate('user');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const item = order.items.find(item => item.itemOrderId === itemId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the order' });
        }

        if (item.itemOrderStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'This item has already been cancelled' });
        }

        item.itemOrderStatus = status;

        if (status === 'Cancelled') {
           
            await Product.findByIdAndUpdate(
                item.product, 
                { $inc: { quantity: item.quantity } }, 
                { new: true }
            );

          
            if (order.payment[0].method === 'Online Payment' && order.payment[0].status === 'completed') {
                const refundAmount = item.saledPrice;
                
                const user = await User.findById(order.user._id);
                if (!user) {
                    throw new Error('User not found');
                }

                let wallet;
                if (!user.wallet) {
                   
                    wallet = new Wallet({
                        balance: refundAmount,
                        transactions: [{
                            type: 'credit',
                            amount: refundAmount,
                            description: `Refund for cancelled item ${item.itemOrderId} in order ${order.orderId}`
                        }]
                    });
                    await wallet.save();
                    user.wallet = wallet._id;
                    await user.save();
                } else {
                  
                    wallet = await Wallet.findById(user.wallet);
                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }
                    wallet.balance += refundAmount;
                    wallet.transactions.push({
                        type: 'credit',
                        amount: refundAmount,
                        description: `Refund for cancelled item ${item.itemOrderId} in order ${order.orderId}`
                    });
                    await wallet.save();
                }
            }

            item.cancelReason = cancelReason || 'Not specified';
        }

       
        const allItemsCancelled = order.items.every(item => item.itemOrderStatus === 'Cancelled');
        if (allItemsCancelled) {
            order.status = 'Cancelled';
        }

        await order.save();

        res.json({ success: true, message: 'Item status updated successfully', order: order });

    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the item status' });
    }
};

const orderDetails = async (req, res, next) => {
    try {
      const { orderId } = req.params;
  
      const order = await Order.findOne({ orderId })
        .populate('user')
        .populate('address')
        .populate('items.product')
        .exec();
  
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      return res.render('customer-order-details', { order });
    } catch (error) {
      console.error('Error fetching order details:', error);
      return next(error);
    }
  };


module.exports = {

orders,
updateOrderStatus,
orderDetails

}
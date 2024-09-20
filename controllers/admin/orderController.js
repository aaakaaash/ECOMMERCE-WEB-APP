const User = require("../../models/userSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");


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
        const { status } = req.body; 

      
        if (!id || !status) {
            return res.status(400).json({ success: false, message: 'Order ID and status are required' });
        }

        
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status: status }, 
            { new: true, runValidators: true } 
        );

       
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
        if (status === 'Cancelled') {
           
            for (const item of updatedOrder.items) {
                const product = item.product;
                if (product) {
                    
                    await Product.findByIdAndUpdate(
                        product._id, 
                        { $inc: { quantity: item.quantity } }, 
                        { new: true } 
                    );
                }
            }
        }

        
        res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });

    } catch (error) {
      
        res.status(500).json({ success: false, message: 'An error occurred while updating the order status' });
    }
};

module.exports = {

orders,
updateOrderStatus

}
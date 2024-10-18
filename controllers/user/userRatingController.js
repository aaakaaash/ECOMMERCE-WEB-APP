const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")
const Rating = require("../../models/ratingSchema")
const Order = require("../../models/orderSchema")


const getRateProduct = async (req, res, next) => {

    try {
        
        const userId = res.locals.user._id;

        
        const { productId } = req.params;

        console.log('User ID:', userId);
        console.log('Product ID:', productId);

        if (!userId) {
            let error = new Error('User not authorized');
            error.status = 403;
            return next(error);
        }

        
        const product = await Product.findById(productId).populate('brand').exec();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        
        const userOrder = await Order.findOne({
            user: userId,
            'items.product': productId,
            'items.itemOrderStatus': 'Delivered' 
        }).exec();

        if (!userOrder) {

            let error = new Error('You can only rate products you have purchased and received');
            error.status = 403;
            return next(error);
        }

        
        const existingRating = await Rating.findOne({ userId, productId });
        if (existingRating) {
            return res.status(400).json({ message: 'You have already rated this product' });
        }


        return res.render('rating-page', { product });
        
    } catch (error) {
        console.error('Error in getRateProduct:', error);
        next(error);
    }
};


module.exports = {
    getRateProduct
}
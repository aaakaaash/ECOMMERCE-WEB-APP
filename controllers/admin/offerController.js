const mongoose = require("mongoose");
const Offer = require("../../models/offerSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const offer = async (req, res) => {
  try {
    const offers = await Offer.find().populate('product').populate('category').exec();
    
    for (const offer of offers) {
      if (offer.usedCount >= offer.usageLimit && offer.status !== "inactive") {
        offer.status = "inactive";
        await offer.save();
      }
    }
    
    return res.render("offers", { offers });
  } catch (error) {
    console.error('Error fetching or updating offers:', error);
    res.status(500).send("An error occurred while processing offers");
  }
};

const createOffer = async (req, res) => {
  try {
    const products = await Product.find({}, 'productName _id');
    const categories = await Category.find({}, 'name _id');
    return res.render("create-offer", { products, categories });
  } catch (error) {
    console.error('Error fetching products and categories:', error);
    res.status(500).send("An error occurred while preparing the create offer page");
  }
};

const addOffer = async (req, res) => {
    try {
      const {
        offerCode,
        title,
        description,
        offerType,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        product,
        category,
        usageLimit,
        startDate,
        endDate,
        status
      } = req.body;
  
      // Check if the offer code already exists
      const existingOffer = await Offer.findOne({ offerCode: offerCode });
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: "Offer code already exists. Please try a different code."
        });
      }
  
      // Create a new offer
      const newOffer = new Offer({
        offerCode,
        title,
        description,
        offerType,
        discountType,
        discountValue: Number(discountValue),
        minPurchaseAmount: Number(minPurchaseAmount),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        product: product === 'all' ? null : product ? new mongoose.Types.ObjectId(product) : undefined,
        category: category === 'all' ? null : category ? new mongoose.Types.ObjectId(category) : undefined,        
        usageLimit: Number(usageLimit),
        startDate,
        endDate,
        status
    });
  
     
      await newOffer.save();
  
      res.status(201).json({
        success: true,
        message: "Offer created successfully",
        offer: newOffer
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the offer"
      });
    }
  };

const deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }

    await Offer.findByIdAndDelete(offerId);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the offer"
    });
  }
};

module.exports = {
  offer,
  createOffer,
  addOffer,
  deleteOffer
};
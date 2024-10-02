const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Offer = require("../../models/offerSchema")

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp")


const getProductAddPage = async (req,res) => {
    try {
        const category = await Category.find({isListed: true });
        res.render("Product-add", {
            cat:category,
        });


    } catch (error) {

        res.redirect("/admin/pageerror")
        
    }
}


const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({ productName: products.productName });
        
        if (productExists) {
            return res.status(400).json("Product already exists, please try with another name");
        } else {
            let images = [];
            
            if (req.files) {
                for (let field of ['images1', 'images2', 'images3']) {
                    if (req.files[field] && req.files[field].length > 0) {
                        let originalImagePath = req.files[field][0].path;

                        const originalDir = path.dirname(originalImagePath);
                        if (!fs.existsSync(originalDir)) {
                            fs.mkdirSync(originalDir, { recursive: true });
                        }

                        let resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[field][0].filename);
                        
                        const directory = path.dirname(resizedImagePath);
                        if (!fs.existsSync(directory)) {
                            fs.mkdirSync(directory, { recursive: true });
                        }
                        
                        await sharp(originalImagePath)
                            .resize({ width: 440, height: 440 })
                            .toFile(resizedImagePath);
                        
                        images.push(req.files[field][0].filename);
                        
                      
                        try {
                            fs.unlinkSync(originalImagePath);
                        } catch (unlinkError) {
                            console.error('Error deleting original file:', unlinkError);
                        }
                    }
                }
            }
            
            const categoryId = await Category.findOne({ name: products.category });
            
            if (!categoryId) {
                return res.status(400).json("Invalid category name");
            }
            
            let productStatus = products.quantity > 0 ? "Available" : "Out of stock";

        
            const offer = await Offer.findOne({ product: categoryId._id });
            let offerPrice = products.salePrice;
            
            if (offer) {
                let offerValue;
                
                if (offer.discountType === 'percentage') {
                    offerValue = products.salePrice * (offer.discountValue / 100);
                } else {
                    offerValue = offer.discountValue;
                }
                
                offerPrice = products.salePrice - offerValue;
                offerPrice = Math.max(offerPrice, 0); 
            }
            
            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                SKUNumber: products.SKUNumber,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                offerPrice: offerPrice,
                createdOn: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                status: productStatus,
            });
            
            await newProduct.save();
            return res.redirect("/admin/addProducts");
        }
    } catch (error) {
        console.error("Error Saving product", error);
        return res.redirect("/admin/pageerror");
    }
};


const getAllProducts = async (req,res)=>{
    try {
        
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 10;
        const productData = await Product.find({
            $or:[
                {productName:{$regex:new RegExp(".*"+search+".*","i")}},
            ],
        }).limit(limit*1).skip((page-1)*limit).populate("category").exec();

        const count = await Product.find({
            $or:[
                {
                    productName:{$regex:new RegExp(".*"+search+".*","i")},
                }
            ],
        }).countDocuments();
        const category = await Category.find({isListed:true});

        if(category){
            res.render("products", {
                data:productData,
                currentPage:page,
                totalPages:page,
                totalPages:Math.ceil(count/limit),
                cat:category,
            })
        } else {
            res.render("page-404")
        }

    } catch (error) {

        res.redirect("/admin/pageerror");
        
    }
}

const blockProduct = async (req,res) => {
    try {
        
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/products")

    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        
       
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).send("Product not found");
        }
        
       
        product.isBlocked = false;
        
       
        if (product.quantity > 0) {
            product.status = "Available";
        } else {
            product.status = "out of stock";
        }
        
        await product.save();
        
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error in unblockProduct:", error);
        res.redirect("/pageerror");
    }
};

const getEditProduct = async (req, res)=>{
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({});
        res.render("edit-product",{
            product:product,
            cat:category,

        })
    } catch (error) {

        res.redirect("/admin/pageerror")
        
    }
}


const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try another name." });
        }

        const category = await Category.findOne({ name: data.category });
        if (!category) {
            return res.status(400).json({ error: "Invalid category name" });
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            category: category._id, 
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            color: data.color
        };

       
        const currentProduct = await Product.findById(id);
        let updatedImages = [...currentProduct.productImage];

        for (let i = 0; i < 3; i++) {
            if (req.files[`images${i+1}`] && req.files[`images${i+1}`].length > 0) {
              
                let originalImagePath = req.files[`images${i+1}`][0].path;
                let filename = `product_${id}_${i+1}_${Date.now()}.jpg`;
                let resizedImagePath = path.join('public', 'uploads', 'product-images', filename);

                await sharp(originalImagePath)
                    .resize({ width: 440, height: 440 })
                    .toFile(resizedImagePath);

            
                try {
                    if (fs.existsSync(originalImagePath)) {
                        fs.unlinkSync(originalImagePath);
                        console.log(`Original file ${originalImagePath} deleted successfully`);
                    }
                } catch (err) {
                    console.error('Error deleting original file:', err);
                }

               
                if (i < updatedImages.length) {
                  
                    if (updatedImages[i]) {
                        let oldImagePath = path.join('public', 'uploads', 'product-images', updatedImages[i]);
                        try {
                            if (fs.existsSync(oldImagePath)) {
                                fs.unlinkSync(oldImagePath);
                                console.log(`Old image file ${oldImagePath} deleted successfully`);
                            }
                        } catch (err) {
                            console.error('Error deleting old image file:', err);
                        }
                    }
                    updatedImages[i] = filename;
                } else {
                    updatedImages.push(filename);
                }
            }
        }

       
        while (updatedImages.length > 3) {
            let removedImage = updatedImages.pop();
            let removedImagePath = path.join('public', 'uploads', 'product-images', removedImage);
            try {
                if (fs.existsSync(removedImagePath)) {
                    fs.unlinkSync(removedImagePath);
                    console.log(`Excess image file ${removedImagePath} deleted successfully`);
                }
            } catch (err) {
                console.error('Error deleting excess image file:', err);
            }
        }

        updateFields.productImage = updatedImages;


        const offer = await Offer.findOne({ product: id });
        if (offer) {
            let offerValue;

            if (offer.discountType === 'percentage') {
                offerValue = data.salePrice * (offer.discountValue / 100);
            } else {
                offerValue = offer.discountValue;
            }

            const offerPrice = data.salePrice - offerValue;
            updateFields.offerPrice = Math.max(offerPrice, 0);
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

        if (updatedProduct.quantity == 0) {
            updatedProduct.status = "out of stock";
        } else {
            updatedProduct.status = "Available";
        }

        await updatedProduct.save();
        res.redirect("/admin/products");

    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};


const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });

        
        const imagePath = path.join("public", "uploads", "product-images", imageNameToServer);
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToServer} not found`);
        }

        
        res.send({ status: true });

    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

const deleteProduct = async (req, res) => {
    try {
      const id = req.query.id;
      const deletedProduct= await Product.findByIdAndDelete(id);
  
      if (deletedProduct) {
        res.json({ status: true, message: 'Product successfully deleted' });
      } else {
        res.status(404).json({ status: false, message: 'Product not found' });
      }
    } catch (error) {
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }

module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    deleteProduct
}


const Category = require("../../models/categorySchema");

const Product = require("../../models/productSchema")




const categoryInfo = async (req, res) => {

    try {
        
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;

        const categoryData = await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render("Category", {
            cat:categoryData,
            currentPage:page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });

    } catch (error) {

        console.error(error);
        res.redirect("/admin/pageerror");
        
    }

}

const addCategory = async (req, res) => {
    const {name,description} = req.body;
    try {
        
        const existingCategory = await Category.findOne({name});
        if(existingCategory) {
            return res.status(400).json({error:"category already exists"})
        }
        const newCategory = new Category({
            name,
            description
        })
        await newCategory.save();
        return res.json({message:"Category added successfully"})

    } catch (error) {

        return res.status(500).json({error:"Internal Server Error"})
        
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.json({ categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


const addCategoryOffer = async (req,res)=> {
    try {
        const percentage = parseInt(req.body.percentage);
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if(!category){
            return res.status(404).json({status:false, message:"Category not found"});
        }
        const products = await Product.find({category:category._id});
        const hasProductOffer = products.some((product)=>product.productOffer > percentage);
        if(hasProductOffer){
            return res.json({status:false , message:"Products within this category already have product offfers"})
        }
        await Category.updateOne({_id:categoryId}, {$set: {categoryOffer:percentage}});

        for(const product of products){
          product.productOffer = 0;
          product.salesPrice = product.regularPrice;
          await  product.save();
        }
        
        res.json({status:true})

    } catch (error) {
        res.status(500).json({ status: false, message:"Internal Server Error"});
    }
}

const removeCategoryOffer = async (req,res)=> {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(404).json({status:false, message:"Category not found"})
        }
        const percentage = category.categoryOffer;
        const products = await Product.find({category:category._id});

        if(products.length > 0) {
            for(const product of products){
                product.salesPrice += Math.floor(product.regularPrice * (percentage/100));
                product.productOffer = 0;
                await product.save();
            }
        };
        category.categoryOffer = 0;
        await category.save()
        res.json({status:true});
    } catch (error) {
        res.status(500).json({status:false, message:"Internal Server Error"})
    }
}


const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        // Correct: Listing the category (set isListed to true)
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        res.redirect("/admin/category");
    } catch (error) {
        res.redirect("/pageerror");
    }
};

const getUnListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        // Correct: Unlisting the category (set isListed to false)
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.redirect("/admin/category");
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
};

const getEditCategory = async (req,res) => {
    try {
        const id = req.query.id;
        const category = await Category.findOne({_id:id});
        res.render("edit-category",{category:category});
    } catch (error) {
        res.redirect("/admin/pageerror")
    }
}


const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { categoryName, description } = req.body;
        const existingCategory = await Category.findOne({ name: categoryName });

        if (existingCategory) {
            return res.status(400).json({ error: "Category exists, please choose another name" });
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, {
            name: categoryName,
            description: description,
        }, { new: true });

        if (updatedCategory) {
            res.redirect("/admin/category");
        } else {
            res.status(404).json({ error: "Category not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}


const deleteCategory = async (req, res) => {
    try {
      const id = req.query.id;
      const deletedCategory = await Category.findByIdAndDelete(id);
  
      if (deletedCategory) {
        res.json({ status: true, message: 'Category successfully deleted' });
      } else {
        res.status(404).json({ status: false, message: 'Category not found' });
      }
    } catch (error) {
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }
  


module.exports ={
    categoryInfo,
    addCategory,
    getCategories,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnListCategory,
    getEditCategory,
    editCategory,
    deleteCategory

}



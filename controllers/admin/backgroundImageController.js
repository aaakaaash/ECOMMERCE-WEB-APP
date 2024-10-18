const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp")

const Image = require("../../models/imageSchema");
const { type } = require("os");


const getAllImages = async (req, res) => {
    try {
      const search = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
  
      
      const images = await Image.find({
        $or: [
          { imageType: { $regex: new RegExp(search, "i") } },
        ],
      })
        .limit(limit)
        .skip((page - 1) * limit);
  
    
      const count = await Image.countDocuments({
        $or: [
          { imageType: { $regex: new RegExp(search, "i") } },
        ],
      });
  
      res.render("banner-background-images", {
        data: images,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      console.error("Error fetching image data:", error);
      res.redirect("/admin/pageerror");
    }
  };



const addNewImage = async (req,res) => {
    try {
       
        res.render("add-banner-background-images");


    } catch (error) {

        res.redirect("/admin/pageerror")
        
    }
}


const saveData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Please upload an image." });
        }

        const normalizedAltText = req.body.altText.trim().toLowerCase().replace(/\s+/g, '');

        const existingImage = await Image.findOne({ altText: normalizedAltText });
        if (existingImage) {
            return res.status(400).json({ error: "Image for the position already exists." });
        }

        const originalImagePath = req.file.path;
        const targetImagePath = path.join('public', 'uploads', 'images-UI', req.file.filename);

        const targetDirectory = path.dirname(targetImagePath);
        if (!fs.existsSync(targetDirectory)) {
            fs.mkdirSync(targetDirectory, { recursive: true });
        }

        fs.renameSync(originalImagePath, targetImagePath);

        const newImage = new Image({
            image: req.file.filename,
            altText: normalizedAltText,
            imageType: req.body.imageType,
            page: req.body.page,
        });

        await newImage.save();

        return res.status(200).json({ message: "Image uploaded successfully" });

    } catch (error) {
        console.error("Error saving image", error);
        return res.redirect("/admin/pageerror");
    }
};


editImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    res.render('banner-background-edit', { image });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.redirect('/admin/banner-background');
  }
};

const saveEditImage = async (req, res) => {
  try {
    const { id } = req.params;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).send("No image file uploaded.");
    }

    const imageToUpdate = await Image.findById(id);
    if (!imageToUpdate) {
      return res.status(404).send("Image not found.");
    }

    
    const originalImagePath = imageFile.path;
    const targetImagePath = path.join('public', 'uploads', 'images-UI', imageFile.filename);

    const targetDirectory = path.dirname(targetImagePath);
    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
    }

    
    fs.renameSync(originalImagePath, targetImagePath);

   
    const oldImagePath = path.join('public', 'uploads', 'images-UI', imageToUpdate.image);
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }

    
    imageToUpdate.image = imageFile.filename;
    await imageToUpdate.save();

    res.status(200).send("Image updated successfully!");

  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).send("Error updating image: " + error.message);
  }
};

module.exports = {

    getAllImages,
    addNewImage,
    saveData,
    editImage,
    saveEditImage

}
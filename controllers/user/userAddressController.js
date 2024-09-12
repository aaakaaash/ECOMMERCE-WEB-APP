const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const crypto = require("crypto")

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");


const userAddress = async (req, res, next) => {
    try {
        const userId = req.session.user || req.user 
        console.log('User ID:', userId);

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        // Fetch addresses from the Address model using the userId
        const address = await Address.find({ userId: userId }).exec();
       

        // If no addresses are found, you can handle it accordingly
        if (!address || address.length === 0) {
            return res.render('user-address', { address: [] }); // Render template with an empty array
        }

        // Render the view with the fetched addresses
        res.render('user-address', { address });

    } catch (error) {
        next(error);  // Pass the error to the error-handling middleware
    }
};



const addNewAddress = async (req,res,next) => {

    try {
        
        res.render("add-address");

    } catch (error) {
        next(error)
    }


}

const updateNewAddress = async (req, res, next) => {
    const { house, place, city, state, pin, landMark, contactNo } = req.body;

    const userId = req.session.user|| req.user

    try {
        const existingAddress = await Address.findOne({ house, pin });
        if (existingAddress) {
            return res.status(400).json({ error: "Address already exists" });
        }
        const newAddress = new Address({
            userId,
            house,
            place,
            city,
            state,
            pin,
            landMark,
            ContactNo: contactNo
        });
        
        await newAddress.save();
        return res.json({ message: "Address added successfully" });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    userAddress,
    addNewAddress,
    updateNewAddress
}
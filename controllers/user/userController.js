
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema")

let sessionActive = false;

const pageNotFound = async (req, res, next) => {
    try {
        res.render("page-404");
    } catch (error) {
        next(error); 
    }
};

const loadHomepage = async (req, res, next) => {
    
    try {
        const products = await Product.find({ isBlocked: false }).populate('category').exec();

        let userId;

        if(req.user){
             userId = req.user; 
        } else if(req.session.user){
            userId = req.session.user;
        }
        if (userId) {
            sessionActive =true;
            const userData = await User.findById(userId);
            res.locals.user = userData; 
            return res.render("home", { user: userData ,
                products:products
            });
        } else {
            res.locals.user = null; 
           
            return res.render("home",{
                products:products
         });
    }
    } catch (error) {
        console.log("Home page not found:", error);
        next(error); 
    }
};

const loadAboutpage = async (req, res, next) => {
    try {
        let userId;

        if(req.user){
             userId = req.user; 
        } else if(req.session.user){
            userId = req.session.user;
        }
        if (userId) {
            const userData = await User.findById(userId);
            res.locals.user = userData; 
            return res.render("about", { user: userData });
        } else {
            res.locals.user = null; 
            return res.render("about");
        }
    } catch (error) {
        console.log("about page not found:", error);
        next(error); 
    }
};

const loadShoppage = async (req, res, next) => {
   
    try {
        const products = await Product.find({ isBlocked: false }).populate('category').exec();
        let userId;

        if(req.user){
             userId = req.user; 
        } else if(req.session.user){
            userId = req.session.user;
        }

        if (userId) {
            const userData = await User.findById(userId);
            res.locals.user = userData; 
            return res.render("shop", { user: userData,
                products:products

             });
        } else {
            res.locals.user = null; 
            return res.render("shop", {
                products:products
            });
        }
    } catch (error) {
        console.log("shop page not found:", error);
        next(error); 
    }
};

const loadContactpage = async (req, res, next) => {
    try {
          let userId;

        if(req.user){
             userId = req.user; 
        } else if(req.session.user){
            userId = req.session.user;
        }
        if (userId) {
            const userData = await User.findById(userId);
            res.locals.user = userData; 
            return res.render("contact", { user: userData });
        } else {
            res.locals.user = null; 
            return res.render("contact");
        }
    } catch (error) {
        console.log("about page not found:", error);
        next(error); 
    }
};

const loadSignup = async (req, res, next) => {
    try {
        if(sessionActive){}else{
        return res.render('signup');
    } } catch (error) {
        console.log("Signup page not loading:", error);
        next(error); 
    }
}

function generateOtp(){

    return Math.floor(100000 + Math.random()*900000).toString();

}

async function sendVerificationEmail(email,otp){
    try {
         
        const transporter = nodemailer.createTransport({

            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify your account",
            text:`Your OTP is ${otp}`, 
            html:`<b>Your OTP: ${otp}</b>`
        })

        return info.accepted.length >0

    } catch (error) {

        console.error("Error sending email",error);
        return false;
    }
}

const signup = async (req, res, next) => {
    
    try {

        const {name,phone,email,password,cPassword} = req.body;

        if(password !== cPassword){
            return res.render("signup",{message:"Passwords are not matching"});
        }
        const findUser = await User.findOne({email});
        if(findUser){
            console.log(findUser)
            return res.render("signup", {message:"User with this email already exists"});
        }

        const otp = generateOtp();

        const emailSent = await sendVerificationEmail(email,otp);
        
        if(!emailSent){
            return res.json("email-error")
        }

        req.session.userOtp = otp;
        req.session.userData = {name,phone,email,password};

        res.render("verify-otp");

        console.log("OTP Sent",otp);

    } catch (error) {
        
        next(error); 
    }
};

const securePassword = async (password)=>{
    try {
        
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash;

    } catch (error) {

        next(error)
        
    }
}

const verifyOtp = async (req, res, next)=>{
    try{
        const {otp} = req.body;
        console.log(otp);
        

        if(otp ===req.session.userOtp){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })

            await saveUserData.save();
            req.session.user = saveUserData._id;
            sessionActive = true;
            res.json({success:true, redirectUrl:"/"})
        }else {
            res.status(400).json({success:false, message:"Invalid OTP, Please try again"})
        }

    } catch (error){

        console.error("Error Verifying OTP",error);
        res.status(500).json({success:false, message:"An error occured"});

    }
}

const resendOtp = async (req, res, next) =>{
    try {
        const {email} = req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }

        const otp = generateOtp();
        req.session.userOtp =otp;

        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resend OTP :", otp)
            res.status(200).json({success:true,message:"OTP Resend Successfully"})
        } else {
            console.log("Failed to send OTP to:", email);
            res.status(500).json({success:false,message:"Failed to resend OTP, Please try again"});
        }
    } catch (error) {
        console.error("Error resending OTP",error);
        next(error)
    }

}

const loadLogin = async (req,res,next)=>{
    try {
        if(!sessionActive){
            return res.render("login");
        }else{
            
            res.redirect("/")
        }
    } catch (error) {
        next(error);
    }
}

const login = async (req, res, next) => {
    try {
        const { email, password, googleId } = req.body;
        
        const findUser = await User.findOne({ role: "user", email: email});

        if (googleId) {
            query.googleId = googleId;  // Add googleId to query only if it's present
        }

        if (!findUser) {
            return res.render("login", { message: "User not found" });
        }
    
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }
        
        if (googleId) {
            // Set the session for Google OAuth users
            req.user = findUser._id;
            sessionActive = true;
            return res.redirect("/");
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect password" });
        }
        
        // Set the session for normal login
        req.session.user = findUser._id;
        sessionActive = true;

        res.redirect("/");
        
    } catch (error) {
        console.error("Login error:", error);
        next(error); 
    }
};

const logout = async (req,res,next)=>{
    try {
        
        req.session.destroy((err)=>{
            if(err){
                console.log("Session destruction error", err.message);
                return res.redirect("/pageNotFound");
            }
            sessionActive = false;
            return res.redirect("/login")
        })

    } catch (error) {
        console.log("logout error",error)
        next(error)
    }
}

module.exports = {
    loadHomepage,
    loadAboutpage,
    loadShoppage,
    loadContactpage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,

}

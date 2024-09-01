
const nodemailer = require("nodemailer");



const env = require("dotenv").config();
const User = require("../../models/userSchema");



const pageNotFound = async (req, res, next) => {
    try {
        res.render("page-404");
    } catch (error) {
        next(error); 
    }
};


const loadHomepage = async (req, res, next) => {
    try {
        return res.render("home");
    } catch (error) {
        console.log("Home page not found:", error);
        next(error); 
    }
};

const loadAboutpage = async (req, res, next) => {
    try {
        return res.render("about");
    } catch (error) {
        console.log("About page not found:", error);
        next(error); 
    }
};

const loadShoppage = async (req, res, next) => {
    try {
        return res.render("shop");
    } catch (error) {
        console.log("Shopping page not found:", error);
        next(error); 
    }
};

const loadContactpage = async (req, res, next) => {
    try {
        return res.render("contact");
    } catch (error) {
        console.log("Contact not found:", error);
        next(error); 
    }
};

const loadSignup = async (req, res, next) => {
    try {
        return res.render('signup');
    } catch (error) {
        console.log("Signup page not loading:", error);
        next(error); 
    }
}

function generateOtp(){

    return Math.floor(1000000 + Math.random()*900000).toString();

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
            return res.render("signup", {message:"User with this email already exists"});
        }

        const otp = generateOtp();

        const emailSent = await sendVerificationEmail(email,otp);
        
        if(!emailSent){
            return res.json("email-error")
        }

        req.session.userOtp = otp;
        req.session.userData = {email,password};

        res.render("verify-otp");
        
        console.log("OTP Sent",otp);

    } catch (error) {
        
        next(error); 
    }
};

module.exports = {
    loadHomepage,
    loadAboutpage,
    loadShoppage,
    loadContactpage,
    pageNotFound,
    loadSignup,
    signup
}
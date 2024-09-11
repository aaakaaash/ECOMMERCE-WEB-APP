const express = require("express");
const router = express.Router();
const nocache = require("nocache")



const userController = require("../controllers/user/userController");
const errorHandler = require('../middlewares/errorHandler');
const preventCache = require("../middlewares/preventCache");
const passport = require("../config/passport");
const productViewController = require("../controllers/user/ProductViewController");
const userProfileController = require("../controllers/user/userProfileController");
const { userAuth } = require("../middlewares/auth");

router.use(nocache());
router.get("/",userController.loadHomepage);
router.get("/home",preventCache,userController.loadHomepage);
router.get("/about",userController.loadAboutpage);
router.get("/shop",userController.loadShoppage);
router.get("/contact",userController.loadContactpage);

// user authentication
router.get("/signup",userController.loadSignup);
router.post("/signup",preventCache,userController.signup);
router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

// user profile management

router.get("/userProfile",userAuth,userProfileController.userProfile);


router.get('/auth/google',preventCache,passport.authenticate('google',{scope:['profile','email']}));

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/');
});

router.get("/login",userController.loadLogin);
router.post("/login",preventCache,userController.login);

router.get("/logout",preventCache,userController.logout);

router.get("/pageNotFound",userController.pageNotFound);

// user product view 

router.get('/product/:productId', productViewController.loadSingleProduct);


router.use(errorHandler);

module.exports = router;
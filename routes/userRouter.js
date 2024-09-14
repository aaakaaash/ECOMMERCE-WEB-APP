const express = require("express");
const router = express.Router();
const nocache = require("nocache")



const userController = require("../controllers/user/userController");
const errorHandler = require('../middlewares/errorHandler');
const preventCache = require("../middlewares/preventCache");
const passport = require("../config/passport");
const productViewController = require("../controllers/user/ProductViewController");
const userProfileController = require("../controllers/user/userProfileController");
const userAddressController = require('../controllers/user/userAddressController')
const userAccountController = require("../controllers/user/userAccountController");
const userCartController = require("../controllers/user/userCartController");
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

// user cart management

router.get("/cart",userAuth,userCartController.cart)

// user profile management

router.get("/login/forget-password",userProfileController.forgetPasswordPage);
router.post("/login/forget-password/forget-email-valid",userProfileController.forgetEmailValidation);
router.post("/verify-passForget-otp",userProfileController.verifyForgetPassOtp)
router.get("/reset-password",userProfileController.getResetPassPage);
router.post("/resend-forget-otp",userProfileController.resendOtp);
router.post("/reset-password",userProfileController.postNewPassword);
router.get("/userProfile",userAuth,userProfileController.userProfile);

// user account management
router.get("/user/account",userAuth,userAccountController.userAccount);
router.post("/user/account/edit-user/:id", userAuth, userAccountController.editUser);


// user address management

router.get("/user/address",userAuth,userAddressController.userAddress)
router.get("/user/add-new-address",userAuth,userAddressController.addNewAddress);
router.post("/user/add-new-address",userAuth,userAddressController.updateNewAddress);
router.get("/user/edit-Address",userAuth,userAddressController.getEditAddress);
router.get("/user/edit-Address/:id",userAuth,userAddressController.getEditAddress);
router.post("/user/edit-Address/:id",userAuth,userAddressController.editAddress);
router.delete('/user/deleteAddress', userAuth, userAddressController.deleteAddress);



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
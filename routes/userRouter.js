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
const userOrderController = require("../controllers/user/userOrderController");
const { userAuth } = require("../middlewares/auth");
const setBreadcrumbs = require('../middlewares/breadCrumb')

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

router.get("/login/forget-password",userProfileController.forgetPasswordPage);
router.post("/login/forget-password/forget-email-valid",userProfileController.forgetEmailValidation);
router.post("/verify-passForget-otp",userProfileController.verifyForgetPassOtp)
router.get("/reset-password",userProfileController.getResetPassPage);
router.post("/resend-forget-otp",userProfileController.resendOtp);
router.post("/reset-password",userProfileController.postNewPassword);
router.get("/userProfile",userAuth,setBreadcrumbs,userProfileController.userProfile);


// user account management
router.get("/user/account",userAuth,setBreadcrumbs,userAccountController.userAccount);
router.post("/user/account/edit-user/:id", userAuth, userAccountController.editUser);


// user address management

router.get("/user/address",userAuth,setBreadcrumbs,userAddressController.userAddress)
router.get("/user/add-new-address",userAuth,userAddressController.addNewAddress);
router.post("/user/add-new-address",userAuth,userAddressController.updateNewAddress);
router.get("/user/edit-Address",userAuth,userAddressController.getEditAddress);
router.get("/user/edit-Address/:id",userAuth,userAddressController.getEditAddress);
router.post("/user/edit-Address/:id",userAuth,userAddressController.editAddress);
router.delete('/user/deleteAddress', userAuth, userAddressController.deleteAddress);

// user cart management

router.get("/cart",userAuth,userCartController.cart)
router.post("/add-cart",userAuth,userCartController.addToCart)
router.post("/cart/update-quantity",userAuth,userCartController.updateQuantity)
router.delete("/cart/remove",userAuth,userCartController.removeFromCart)

// order management

router.get("/cart/place-order",userAuth,userOrderController.placeOrder);
router.post("/cart/place-order/make-payment",userAuth,userOrderController.loadPayment);
router.post("/cart/place-order/make-payment/confirm-order",userAuth,userOrderController.confirmOrder);
router.get("/user/order-confirmation", userAuth,userOrderController.orderConfirmationPage);

router.get("/user/my-order",userAuth,setBreadcrumbs,userOrderController.myOrder);
router.post("/user/my-order/cancel/:orderId", userAuth, userOrderController.cancelOrder);


// user google authentication managaement

router.get('/auth/google',preventCache,passport.authenticate('google',{scope:['profile','email']}));

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/');
});

//user login 

router.get("/login",userController.loadLogin);
router.post("/login",preventCache,userController.login);

router.get("/logout",preventCache,userController.logout);

router.get("/pageNotFound",userController.pageNotFound);

// user product view 

router.get('/product/:productId', productViewController.loadSingleProduct);


router.use(errorHandler);

module.exports = router;
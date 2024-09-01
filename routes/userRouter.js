const express = require("express");
const router = express.Router();


const userController = require("../controllers/user/userController");
const errorHandler = require('../middlewares/errorHandler');


router.get("/",userController.loadHomepage);
router.get("/home",userController.loadHomepage);
router.get("/about",userController.loadAboutpage);
router.get("/shop",userController.loadShoppage);
router.get("/contact",userController.loadContactpage);
router.get("/signup",userController.loadSignup);
router.post("/signup",userController.signup);
router.get("/pageNotFound",userController.pageNotFound);


router.use(errorHandler);

module.exports = router;
const express = require("express")
const router = express.Router();
const nocache =require("nocache");


const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const catergoryController = require("../controllers/admin/categoryController");
const {userAuth, adminAuth} = require("../middlewares/auth");



router.use(nocache());

router.get("/pageerror",adminController.pageerror)

//login management

router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login)
router.get("/",adminAuth,adminController.loadDashboard);
router.get("/dashboard",adminAuth,adminController.loadDashboard);
router.get("/logout",adminController.logout);

//customer management

router.get("/users",adminAuth,customerController.customerInfo)
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerUnBlocked);


//category management

router.get("/category",adminAuth,catergoryController.categoryInfo);
router.post("/addCategory",adminAuth,catergoryController.addCategory);
router.get("/getCategories", adminAuth, catergoryController.getCategories);


module.exports = router;
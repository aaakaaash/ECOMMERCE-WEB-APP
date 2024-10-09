const express = require("express")
const router = express.Router();
const path = require("path");
const multer = require("multer");
const nocache =require("nocache");


const {userAuth, adminAuth} = require("../middlewares/auth");
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController = require("../controllers/admin/brandController");
const productController = require("../controllers/admin/productController");
const orderController  = require("../controllers/admin/orderController");
const couponController  = require("../controllers/admin/couponController");
const offerController  = require("../controllers/admin/offerController");
const salesReportController = require("../controllers/admin/salesReportController");
const referralOfferController = require("../controllers/admin/referralOfferController");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      
      cb(null, path.join(__dirname, '..', 'public', 'storage', 'product-images'));
  },
  filename: function (req, file, cb) {
     
      cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });




router.use(nocache());

router.get("/pageerror",adminAuth,adminController.pageerror)

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

router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.get("/getCategories", adminAuth, categoryController.getCategories);
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer", adminAuth, categoryController.removeCategoryOffer);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnListCategory);
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.get("/editCategory/:id",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id", adminAuth, categoryController.editCategory);
router.delete('/deleteCategory', adminAuth, categoryController.deleteCategory);

// brand management

router.get("/brand",adminAuth,brandController.brandInfo);
router.post("/addBrand",adminAuth,brandController.addBrand);
router.get("/getBrands", adminAuth, brandController.getBrands);
router.get("/listBrand",adminAuth,brandController.getListBrand);
router.get("/unlistBrand",adminAuth,brandController.getUnListBrand);
router.get("/editBrand",adminAuth,brandController.getEditBrand);
router.get("/editBrand/:id",adminAuth,brandController.getEditBrand);
router.post("/editBrand/:id", adminAuth, brandController.editBrand);
router.delete('/deleteBrand', adminAuth, brandController.deleteBrand);

//Product management

router.get("/addProducts", adminAuth,productController.getProductAddPage);
router.post("/addProducts", adminAuth, upload.fields([
  { name: 'images1', maxCount: 1 },
  { name: 'images2', maxCount: 1 },
  { name: 'images3', maxCount: 1 }
]), productController.addProducts);
router.get("/products",adminAuth,productController.getAllProducts);
router.get("/blockProduct",adminAuth,productController.blockProduct);
router.get("/unblockProduct",adminAuth,productController.unblockProduct);
router.get("/editProduct",adminAuth,productController.getEditProduct);
router.post("/editProduct/:id", adminAuth, upload.fields([
  { name: 'images1', maxCount: 1 },
  { name: 'images2', maxCount: 1 },
  { name: 'images3', maxCount: 1 }
]), productController.editProduct);

router.post("/deleteImage",adminAuth,productController.deleteSingleImage);
router.delete('/deleteProduct', adminAuth, productController.deleteProduct);

// order management

router.get("/orders",adminAuth,orderController.orders);
router.post('/updateOrderItemStatus/:id', adminAuth, orderController.updateOrderStatus);
router.get("/orders/order-details/:orderId", adminAuth,orderController.orderDetails);

// coupon management

router.get("/coupons",adminAuth,couponController.coupon)
router.get("/create-coupon",adminAuth,couponController.createCoupon)
router.post("/create-coupon/add-coupon",adminAuth,couponController.addCoupon)
router.get('/coupons/edit/:couponId', adminAuth, couponController.editCoupon);
router.put('/coupons/:couponId', adminAuth, couponController.updateCoupon); 

router.delete("/coupons/delete-coupon/:couponId",adminAuth,couponController.deleteCoupon)

// offer management

router.get("/offers",adminAuth,offerController.offer)
router.get("/create-offer",adminAuth,offerController.createOffer)
router.post("/create-offer/add-offer",adminAuth,offerController.addOffer)
router.delete("/offers/delete-offer/:offerId",adminAuth,offerController.deleteOffer)


// sales report

router.get('/sales-report',adminAuth, salesReportController.getSalesReport)
router.post('/filter-sales',adminAuth, salesReportController.filterSalesReport);
router.post('/download-report',adminAuth, salesReportController.downloadReport);

// referral offer

router.get("/referral-offer",adminAuth, referralOfferController.getReferralOffers)
router.post("/referral-offer/create",adminAuth, referralOfferController.createReferralOffer)
router.delete("/referral-offer/delete/:id", adminAuth, referralOfferController.deleteReferralOffer);


module.exports = router;
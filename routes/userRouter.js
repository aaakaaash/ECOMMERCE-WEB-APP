const express = require("express");
const router = express.Router();


const userController = require("../controllers/userController");
const errorHandler = require('../middlewares/errorHandler');

router.get("/pageNotFound",userController.pageNotFound);
router.get("/",userController.loadHomepage);


router.use(errorHandler);

module.exports = router;
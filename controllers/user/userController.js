const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const env = require("dotenv").config();
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");

const ReferralOffer = require("../../models/referralOfferSchema");
const Referral = require("../../models/referralSchema");
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema")

const Image = require("../../models/imageSchema")

const { calculateAverageRatings }= require("../user/userRatingController")

const {
  applyReferralOffer,
  creditWallet,
} = require("../../controllers/user/userReferralController");

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
    const searchQuery = req.query.searchQuery || "";
    const { sortBy } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    let searchCondition = { isBlocked: false };

    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      searchCondition.$or = [{ productName: regex }];
    }

    const listedCategories = await Category.find({ isListed: true })
      .select("_id")
      .exec();
    const listedCategoryIds = listedCategories.map((cat) => cat._id);
    searchCondition.category = { $in: listedCategoryIds };

    const listedBrands = await Brand.find({ isListed: true })
      .select("_id")
      .exec();
    const listedBrandIds = listedBrands.map((brand) => brand._id);
    searchCondition.brand = { $in: listedBrandIds };

    let sortCriteria = {};
    switch (sortBy) {
      case "popularity":
        sortCriteria = { popularity: -1 };
        break;
      case "priceLowToHigh":
        sortCriteria = { salePrice: 1 };
        break;
      case "priceHighToLow":
        sortCriteria = { salePrice: -1 };
        break;
      case "averageRatings":
        sortCriteria = { averageRating: -1 };
        break;
      case "featured":
        sortCriteria = { isFeatured: -1 };
        break;
      case "newArrivals":
        sortCriteria = { createdAt: -1 };
        break;
      case "aToZ":
        sortCriteria = { productName: 1 };
        break;
      case "zToA":
        sortCriteria = { productName: -1 };
        break;
      default:
        sortCriteria = {};
    }

    const products = await Product.find(searchCondition)
      .populate("category")
      .populate("brand")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean() 
      .exec();

      const productIds = products.map(product => product._id);
      const averageRatings = await calculateAverageRatings(productIds);
  
    
      const productsWithRatings = products.map(product => ({
        ...product,
        averageRating: averageRatings[product._id.toString()]?.averageRating || 0,
        totalRatings: averageRatings[product._id.toString()]?.totalRatings || 0
      }));

    const totalProducts = await Product.countDocuments(searchCondition);
    const totalPages = Math.ceil(totalProducts / limit);

    let userId = req.user || req.session.user;
    let userData = userId
      ? await User.findById(userId).populate("cart").exec()
      : null;
    if (userData && userData.cart && !userData.cart.items) {
      userData.cart.items = [];
    }

    res.locals.user = userData;

    const offer = await Offer.find({ status: "active" })
      .populate("category")
      .populate("product")
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();

      const bannerImages = await Image.find({
        imageType: 'banner',
        page: 'home'
      }).sort({ altText: 1 }).limit(3); 

      const backgroundImage1 = await Image.findOne({
        imageType: 'background',
        page: 'home',
        altText: 'midbanner'
      });
      
      const backgroundImage2 = await Image.findOne({
        imageType: 'background',
        page: 'home',
        altText: 'midbanner1'
      });

    return res.render("home", {
      user: userData,
      products: productsWithRatings, 
      sortBy: sortBy || "",
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      offer: offer.length ? offer[0] : null,
      bannerImages: bannerImages,
      backgroundImage1: backgroundImage1,
      backgroundImage2: backgroundImage2
    });
  } catch (error) {
    console.log("Home page not found:", error);
    next(error);
  }
};

const loadAboutpage = async (req, res, next) => {
  try {
    let userId;

    if (req.user) {
      userId = req.user;
    } else if (req.session.user) {
      userId = req.session.user;
    }

    const bannerImage = await Image.findOne({
      imageType: 'banner',
      page: 'shop',
      altText: 'inner'
    });

    const backgroundImage1 = await Image.findOne({
      imageType: 'background',
      page: 'about',
      altText: 'first'
    });
    
    const backgroundImage2 = await Image.findOne({
      imageType: 'background',
      page: 'about',
      altText: 'second'
    });

    if (userId) {
      let userData = userId
        ? await User.findById(userId).populate("cart").exec()
        : null;
      if (userData && userData.cart && !userData.cart.items) {
        userData.cart.items = [];
      }
      res.locals.user = userData;
      return res.render("about", { user: userData, bannerImage,  backgroundImage1: backgroundImage1,
        backgroundImage2: backgroundImage2 });
    } else {
      res.locals.user = null;
      return res.render("about", { bannerImage,  backgroundImage1: backgroundImage1,
        backgroundImage2: backgroundImage2 });
    }
  } catch (error) {
    console.log("about page not found:", error);
    next(error);
  }
};

const loadShoppage = async (req, res, next) => {
  try {
    const searchQuery = req.query.searchQuery || "";
    const { sortBy, category } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    let searchCondition = { isBlocked: false };

    if (searchQuery.trim() !== "") {
      const regex = new RegExp(searchQuery, "i");
      searchCondition.$or = [{ productName: regex }];
    }

    if (category && category !== "") {
      searchCondition.category = category;
    } else {
      const listedCategories = await Category.find({ isListed: true })
        .select("_id")
        .exec();
      const listedCategoryIds = listedCategories.map((cat) => cat._id);
      searchCondition.category = { $in: listedCategoryIds };
    }

    const listedBrands = await Brand.find({ isListed: true })
      .select("_id")
      .exec();
    const listedBrandIds = listedBrands.map((brand) => brand._id);
    searchCondition.brand = { $in: listedBrandIds };

    let sortCriteria = {};
    switch (sortBy) {
      case "popularity":
        sortCriteria = { popularity: -1 };
        break;
      case "priceLowToHigh":
        sortCriteria = { salePrice: 1 };
        break;
      case "priceHighToLow":
        sortCriteria = { salePrice: -1 };
        break;
      case "averageRatings":
        sortCriteria = { averageRating: -1 };
        break;
      case "featured":
        sortCriteria = { isFeatured: -1 };
        break;
      case "newArrivals":
        sortCriteria = { createdAt: -1 };
        break;
      case "aToZ":
        sortCriteria = { productName: 1 };
        break;
      case "zToA":
        sortCriteria = { productName: -1 };
        break;
      default:
        sortCriteria = {};
    }

    const products = await Product.find(searchCondition)
      .populate("category")
      .populate("brand")
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(); 
      
      const productIds = products.map(product => product._id);
      const averageRatings = await calculateAverageRatings(productIds);
  
    
      const productsWithRatings = products.map(product => ({
        ...product,
        averageRating: averageRatings[product._id.toString()]?.averageRating || 0,
        totalRatings: averageRatings[product._id.toString()]?.totalRatings || 0
      }));



    const totalProducts = await Product.countDocuments(searchCondition);
    const totalPages = Math.ceil(totalProducts / limit);

    let userId = req.user || req.session.user;
    let userData = userId
      ? await User.findById(userId).populate("cart").exec()
      : null;
    if (userData && userData.cart && !userData.cart.items) {
      userData.cart.items = [];
    }
    res.locals.user = userData;

    const categories = await Category.find({ isListed: true }).exec();

    const offer = await Offer.find()
      .populate("category")
      .populate("product")
      .exec();

      const bannerImage = await Image.findOne({
        imageType: 'banner',
        page: 'shop',
        altText: 'inner'
      });


    return res.render("shop", {
      user: userData,
      products: productsWithRatings, 
      categories: categories,
      sortBy: sortBy || "",
      currentPage: page,
      totalPages: totalPages,
      totalProducts: totalProducts,
      offer,
      selectedCategory: category || "",
      searchQuery,
      message: products.length === 0 ? "No products found." : "",
      bannerImage
    });
  } catch (error) {
    console.log("shop page not found:", error);
    next(error);
  }
};

const loadContactpage = async (req, res, next) => {
  try {
    let userId;

    if (req.user) {
      userId = req.user;
    } else if (req.session.user) {
      userId = req.session.user;
    }

    let userData = null;
    if (userId) {
      userData = await User.findById(userId).populate("cart").exec();
      if (userData && userData.cart && !userData.cart.items) {
        userData.cart.items = [];
      }
    }

    const bannerImage = await Image.findOne({
      imageType: 'banner',
      page: 'shop',
      altText: 'inner'
    });

    res.locals.user = userData;
    return res.render("contact", { user: userData, bannerImage });

  } catch (error) {
    console.log("about page not found:", error);
    next(error);
  }
};

const loadSignup = async (req, res, next) => {
  try {
    if (sessionActive) {
    } else {
      return res.render("signup");
    }
  } catch (error) {
    console.log("Signup page not loading:", error);
    next(error);
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}

const signup = async (req, res, next) => {
  try {
    const { name, phone, email, password, cPassword, refCode } = req.body;

    if (password !== cPassword) {
      return res.render("signup", { message: "Passwords are not matching" });
    }
    const findUser = await User.findOne({ email });

    if (findUser) {
      return res.render("signup", {
        message: "User with this email already exists",
      });
    }

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password, refCode };

    res.render("verify-otp");

    console.log(refCode);

    console.log("OTP Sent", otp);
  } catch (error) {
    next(error);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp !== req.session.userOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP, Please try again" });
    }

    const user = req.session.userData;
    const passwordHash = await securePassword(user.password);

    const existingUser = await User.findOne({
      $or: [{ email: user.email }, { phone: user.phone }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({
          success: false,
          message: "User with this email or phone already exists",
        });
    }

    const saveUserData = new User({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: passwordHash,
    });

    await saveUserData.save();

    const newWallet = new Wallet({ user: saveUserData._id, balance: 0 });
    await newWallet.save();

    saveUserData.wallet = newWallet._id;
    await saveUserData.save();

    const newCart = new Cart({ userId: saveUserData._id, items: [] });
    await newCart.save();

    
    saveUserData.cart = newCart._id;

    await saveUserData.save();

    if (user.refCode) {
      await applyReferralOffer(saveUserData._id, user.refCode);
    }

    req.session.user = saveUserData._id;
    sessionActive = true;

    res.status(200).json({ success: true, redirectUrl: "/" });
  } catch (error) {
    console.error("Error Verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found in session" });
    }

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resend OTP :", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP Resend Successfully" });
    } else {
      console.log("Failed to send OTP to:", email);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to resend OTP, Please try again",
        });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    next(error);
  }
};

const loadLogin = async (req, res, next) => {
  try {
    if (!sessionActive) {
      return res.render("login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
  
    const { email, password, googleId } = req.body;

    let findUser = await User.findOne({ email: email }).populate('cart wallet');

    if (googleId) {
      if (!findUser) {
      
        findUser = new User({
          email: email,
          googleId: googleId,
          role: "user",
          isVerified: true
        });
        await findUser.save(); 
      
      
        const newWallet = new Wallet({ user: findUser._id, balance: 0 });
        await newWallet.save();
        findUser.wallet = newWallet._id;

        const newCart = new Cart({ userId: findUser._id, items: [] });
        await newCart.save();
        findUser.cart = newCart._id;

        await findUser.save();
        console.log("hello")
        console.log(findUser)
      } else {
        
        if (!findUser.googleId) {
        
          findUser.googleId = googleId;
        }

    
        if (!findUser.wallet) {
          const newWallet = new Wallet({ user: findUser._id, balance: 0 });
          await newWallet.save();
          findUser.wallet = newWallet._id;
        }

        if (!findUser.cart) {
          const newCart = new Cart({ userId: findUser._id, items: [] });
          await newCart.save();
          findUser.cart = newCart._id;
        }

        await findUser.save();
      }

      req.session.user = findUser.toObject(); 
      sessionActive = true;
      return res.redirect("/");
    }

    if (!findUser) {
      return res.render("login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("login", { message: "User is blocked by admin" });
    }

    if (!findUser.password) {
      return res.render("login", { message: "Please use Google Sign-In for this account" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if (!passwordMatch) {
      return res.render("login", { message: "Incorrect password" });
    }

    req.session.user = findUser._id;
    sessionActive = true;

    res.redirect("/");

  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error", err.message);
        return res.redirect("/pageNotFound");
      }
      sessionActive = false;
      return res.redirect("/login");
    });
  } catch (error) {
    console.log("logout error", error);
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
  signup,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  logout,
};

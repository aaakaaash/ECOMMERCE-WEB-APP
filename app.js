const express = require("express");
const app = express();
const path = require("path");
const multer= require("multer");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");


const env = require('dotenv').config();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");

const errorHandler = require("./middlewares/errorHandler");
const passport = require('./config/passport');
const preventCache = require("./middlewares/preventCache");
const nocache = require("nocache");
const { userAuth,adminAuth } = require("./middlewares/auth");
const setBreadcrumbs = require('./middlewares/breadCrumb');

const methodOverride = require('method-override');


db();

app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(methodOverride((req, res) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      const method = req.body._method;
      delete req.body._method;
      return ['PUT', 'PATCH'].includes(method) ? method : undefined;
    }
  }));


app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

app.use(nocache())
app.use(passport.initialize());
app.use(passport.session());


app.set("view engine","ejs")
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')]);

app.use(express.static(path.join(__dirname,"public")));

app.use("/",userRouter);



app.use("/admin",adminRouter);



app.use(preventCache);


app.use(errorHandler);


app.listen(process.env.PORT,()=>{
    console.log("Server Running");
})

module.exports = app;








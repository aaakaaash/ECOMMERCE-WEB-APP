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

const allowedOrigins = ['http://localhost:3000', 'https://akashravikumar.live'];

app.use(cors({
    origin: function(origin, callback) {

        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
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

app.use(preventCache);

app.use("/",userRouter);

app.use("/admin",adminRouter);


app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});


app.use(errorHandler);

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});


process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});


app.listen(process.env.PORT,()=>{
    console.log("Server Running");
})

module.exports = app;








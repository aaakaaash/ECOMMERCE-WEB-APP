const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");


const env = require('dotenv').config();
const db = require("./config/db");
const userRouter = require("./routes/userRouter");
const errorHandler = require("./middlewares/errorHandler");
const passport = require('./config/passport')
db();


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

app.use(passport.initialize());
app.use(passport.session());

app.set("view engine","ejs")
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')]);
app.use(express.static(path.join(__dirname,"public")));
app.use("/",userRouter);

app.use(errorHandler);

app.listen(process.env.PORT,()=>{
    console.log("Server Running");
})

module.exports = app;








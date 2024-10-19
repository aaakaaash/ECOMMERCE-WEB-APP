const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/userSchema");
const env = require("dotenv").config();

const Wallet = require("../models/walletSchema")
const Cart = require("../models/cartSchema")



passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/auth/google/callback'
    },

    async (accessToken,refreshToken,profile,done)=>{
        try {
            let user = await User.findOne({googleId:profile.id});
            if(user){
                return done(null,user);
            }else {
                user = new User({
                    name:profile.displayName,
                    email:profile.emails[0].value,
                    googleId:profile.id,
                    role: "user", 
          isVerified: true
                })

                const newWallet = new Wallet({ user: user._id, balance: 0 });
        await newWallet.save();
        user.wallet = newWallet._id;

                const newCart = new Cart({ userId: user._id, items: [] });
                await newCart.save();
                user.cart = newCart._id

                await user.save();
                return done(null,user);
            }
        } catch (error) {

            return done(error,null)
            
        }
    }

))

passport.serializeUser((user,done)=>{

    done(null,user.id)

})

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    }).catch(err =>{
        done(err,null)
    })
})

module.exports = passport;
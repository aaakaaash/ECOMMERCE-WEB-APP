const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const userSchema = new Schema({
    userId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        unique:true,
        sparse:true,
        default: null
    },
    googleId: {
        type: String,
        required: false,
        unique:true,
        sparse:true
    },
    password: {
        type: String, 
        required: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["user","admin",'owner'],
        default:"user",
        required:false
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String,
        required: false
    },
    redeemed: {
        type: Boolean
    },
    redeemedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category"
        },
        brand: {
            type: String
        },
        searchOn: {
            type: Date,
            default: Date.now
        }
    }]
});

const User = mongoose.model("User", userSchema);
module.exports = User;

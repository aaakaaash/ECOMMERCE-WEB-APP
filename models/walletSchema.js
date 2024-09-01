const mongoose = require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4} = require("uuid");

const walletSchema = new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
        balance: {
            type:Number,
            required:true,
            default:0
        },
        transactions:[{
            transactionId:{
                type:String,
                default: ()=>uuidv4(),
                unique:true
            },
            amount:{
                type:Number,
                required:true
            },
            date:{
                type:Date,
                dafault:Date.now
            },
            description:{
                type:String,
                required:false
            }
        }]
});

const Wallet = mongoose.model("Wallet",walletSchema)

module.exports = Wallet;

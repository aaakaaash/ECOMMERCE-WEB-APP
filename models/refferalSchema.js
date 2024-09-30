const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const refferalSchema = new Schema({

    referralId: {
        type: String,
        unique: true
      },
      referralLink: {
        type: String,
        unique: true
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'user'
      },
      createdAt: {
        type: Date,
        default: Date.now()
      }

})



const Refferal = mongoose.model("Refferal", refferalSchema);

module.exports = Refferal;
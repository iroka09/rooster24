const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const sharesSchema = new Schema({
        art_id: Schema.Types.ObjectId,
        code: String, 
        shared: {
          type: Boolean,
          default: false
        },
        timestamp: {
          type: Number,
          default: ()=> Date.now()
        }
      });

module.exports = mongoose.model("share", sharesSchema)
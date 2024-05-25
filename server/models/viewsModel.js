const mongoose = require("mongoose")
const md5 = require("md5")

const Schema = mongoose.Schema;

const viewsSchema = new Schema({
    owner: Schema.Types.ObjectId,
    art_id: Schema.Types.ObjectId,
    device_id: {
          type: String,
      //  set: (x)=>md5(x),
          unique: true,
          index: true,
    },
    earned: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Number,
      default: ()=> Date.now()
    }
});

module.exports = mongoose.model("view", viewsSchema)

const mongoose = require("mongoose");


const Schema = mongoose.Schema;

let codeSchema = new Schema({
  code: {
    type: String,
    unique: true, 
    index: true,
    require: true 
  },
  email: {
    type: String,
    require: true 
  },
  expires: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("code", codeSchema)
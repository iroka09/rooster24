const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const visitorsSchema = new Schema({
  ip: String,
  userAgent: String,
  uniqueCode: {
    type: String,
    unique: true,
    index: true,
  },
  continent: String,
  country: String,
  state: String,
  lat: String,
  lng: String,
  timestamp: {
    type: Number,
    default: ()=>Date.now()
  },
  timeUTC: String
});

module.exports = mongoose.model("visitor", visitorsSchema)
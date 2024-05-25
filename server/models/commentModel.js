
const mongoose = require("mongoose")
const {isEmail, isURL} = require("validator")

const Schema = mongoose.Schema;




const commentSchema = new Schema({
    owner: {
      type:Schema.Types.ObjectId,
      ref: "user"
    },
    art_id: Schema.Types.ObjectId,
    body: {
        type: String,
        require: [true, "Please write a comment."],
        maxlength: [1500, "Sorry, maximum of 1,500 characters allowed, please delete some words."]
    },
    // For none members only
    userAgent: String, 
    name: {
      type: String,
      maxlength: [15, "Your name is longer than 200 characters."]
    },
    gender: {
      type: String,
      enum: ["Male", "Female"]
    },
    email: {
      type: String,
      lowercase: true, 
      maxlength: [200, "Email is longer than 200 characters."],
      validate: [(x)=>{
       return isEmail(x)||x===""
      }, "Invalid email."],
      default: ""
    },
    website: {
      type: String,
      lowercase: true, 
      maxlength: [200, "Website url is longer than 200 characters."],
      validate: [(x)=>{
       return isURL(x)||x===""
      }, "Invalid email."],
      default: ""
    },
    country: String,
    state: String,
    //=== 
    isMember: {
      type: Boolean,
      default: true
    },
    timestamp: {
      type: Number,
      default: ()=> Date.now()
    }
});

module.exports = mongoose.model("comment", commentSchema)
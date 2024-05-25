const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const likesSchema = new Schema({
    owner: Schema.Types.ObjectId,
    //not member
    userAgent: String,
    //==
    art_id: Schema.Types.ObjectId,
    code: {
      type: String, 
      unique: true,
      index: true,
    }
});

module.exports = mongoose.model("like", likesSchema)
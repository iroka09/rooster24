
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clubSchema = new Schema({
  name: {
    type: String, 
    required: [true, "Insert name please."],
    unique: true
  },
  test: [{
    name: String, 
  /*  required: true, 
    unique: true */
  }],
  players: [{
    type: Schema.Types.ObjectId,
    ref: "player"
  }]
});

const playerSchema = new Schema({
  name: {
    type: String, 
    required: [true, "Insert name please."],
    unique: true
  },
  club: {
    type: Schema.Types.ObjectId,
    ref: "club"
  }
});


module.exports.clubModel = mongoose.model("club", clubSchema);

module.exports.playerModel = mongoose.model("player", playerSchema)
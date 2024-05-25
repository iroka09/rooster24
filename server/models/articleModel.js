
const mongoose = require("mongoose");
const moment = require("moment");
const bytes = require("bytes");
const cheerio = require("cheerio");
const cats = require("../categories")






const pictureMinAlt = 7;


const Schema = mongoose.Schema;

const articleSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    required: [true, "Server error occured."],
    ref: "user"
  },

  state: {
    type: String,
    default: "pending"
  },

  title: {
    type: String,
    required: [true, "Title is required."],
    minlength: [20, "Title characters total length is below 20."],
    maxlength: [150, "Title characters total length is above 150."],
  },
  category: {
    type: String,
    required: [true, "Category is required."],
    validate: [(x) => {
      return cats.includes(x)
    }, "Unknown category."]
  },
  tags: {
    type: String,
    match: [/^(#\w+,\s*)*(#\w+)?$/, "Wrong tag format."],
    validate: [(x) => {
      return !(/#\w{11,}/i.test(x)) && (x.split(/,\s*/).length < 30)
    }, "Tags rejected, either total tags are more than 30 or there is a tag that has more than 10 characters long."]
  },
  body: {
    type: String,
    required: [true, "Body content is required."],
    validate: [(x) => {
      let $ = cheerio.load(`<b id="u4">${x}</b>`);
      let picAltValid = ($('img[src^="/article/image/"]').length >= pictureMinAlt) ? true : false;
      let cl = $("b#u4 img").length;
      let str = $("b#u4").text().replace(/\s+/g, " ");
      let sl = str.length;
      let wd = str.split(/\s+/g).length;
      if ((sl >= 500 && sl <= 8000 && wd >= 100 && wd <= 4000 && cl < 21 && cl > 0) || picAltValid) return true;
      else return false;
    }, `Error: Since total words/characters are not in the required range, therefore you must insert at least ${pictureMinAlt} pictures.`]
  },
  thumb: {
    buffer: Buffer,
    size: {
      type: Number,
      required: [true, "Thumbnail image is required."],
      validate: [(x) => {
        return x > bytes("2kb") && x < bytes("300kb")
      }, "Thumbnail file size not accepted"]
    }
  },
  pics: {
    buffers: [Buffer],
    sizes: {
      type: [Number],
      required: [true, "At least one body picture is required."],
      validate: [(x) => {
        return x.every((a) => a >= bytes("2kb") && a <= bytes("1MB")) && x.length > 0 && x.length < 21
      }, "Image size must fall between 2kb to 1mb, and total images of 1 to 20."]
    }
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "comment"
  }],
  views: [{
    type: Schema.Types.ObjectId,
    ref: "view"
  }],
  timestamp: {
    type: Number,
    default: () => Date.now()
  }
});

module.exports = mongoose.model("article", articleSchema)
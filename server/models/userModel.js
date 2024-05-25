

const mongoose = require("mongoose");
const { isMD5 } = require("validator");
const moment = require("moment");
const ngBanks = require("../ng-banks");
// const random = require("random");
const uid = require("../uid");






const Schema = mongoose.Schema;

let mainSchema = {
  username: {
    type: String,
    unique: true,
    index: true,
    immutable: true, //username cannot be changed in future
  },
  profile_pic: Buffer,
  fname: String,

  lname: String,

  gender: {
    type: String,
    enum: ["Male", "Female"], //user must one of these values
  },

  pic_link: String,

  date: Number,

  month: String,

  year: Number,

  email: {
    type: String,
    lowercase: true,
    unique: true,
    index: true
  },

  country: String,

  state: String,

  last_seen: {
    type: Number,
    default: () => Date.now()
  },
  /* 
    phone: {
        type: String,
        unique: true
    },
   */
  pass: {
    type: String,
    validate: [isMD5, "Valid password, but server has problem with this password."]
  },

  bio: {
    type: String,
    maxlength: [150, "Maximum of 50 characters allowed."],
    default: "Hello, welcome to my profile."
  },

  occupation: {
    type: String,
    maxlength: [50, "Maximum of 50 characters allowed."],
    default: "(not set)"
  },

  balance: {
    type: Number,
    min: [0, "Account can't fall below 0"],
    default: 0
  },

  //date when a user earned last from views
  lastEarnedFromViews: {
    type: Number,
    default: 0
  },

  account_name: {
    type: String,
    maxlength: [200, "Account name is too long"],
    trim: true,
    default: ""
  },

  bank_name: {
    type: String,
    maxlength: [50, "Bank name is too long"],
    trim: true,
    default: ""
  },

  account_number: {
    type: Number,
    maxlength: [50, "Account number is too long"],
    trim: true,
    default: 0
  },

  //[1000, "pending|paid", time in miniseconds]
  pendingWithdrawal: {
    type: [Schema.Types.Mixed],
    default: []
  },

  withdrawalHistory: [{
    date: Number,
    withdrawn: Number,
    totalClicks: Number,
    receiver: String
  }],

  referral_id: {
    type: String,
    default: () => uid()
  },

  timestamp: {
    type: Number,
    default: () => Date.now()
  },

  blocked_list: [Schema.Types.ObjectId],

  isAdmin: {
    type: Boolean,
    default: false
  },

  // [true,"Your account has been disabled.", countdown_time || admin_decides]
  isDisabledAccount: {
    type: [Schema.Types.Mixed],
    default: []
  },

  //[true, countdown(in millisecond)]
  scheduleAccountDeletion: {
    type: [Schema.Types.Mixed],
    default: []
  },

  articles: [{
    type: Schema.Types.ObjectId,
    ref: "article"
  }],

  //true means visible
  visibleDetails: {
    type: Object,
    default: {
      email: true,
      phone: true,
      last_seen: true,
      occupation: true,
      gender: true,
      date: true,
      month: true,
      year: true
    }
  },
}




module.exports.userModel = mongoose
  .model("user", mainSchema, "users");




let pendingSchema = { ...mainSchema };
pendingSchema.username.unique = false;
pendingSchema.email.unique = false;
pendingSchema.expires = {
  type: Number,
  default: Infinity
};
//pendingSchema.phone.unique = false

module.exports.pendingUserModel = mongoose
  .model("pendingUser", pendingSchema, "pendingUsers");
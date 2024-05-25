
const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const bytes = require("bytes");
const imageSize = require("image-size");
const fs = require("fs")
const cheerio = require("cheerio")
//testUserModel used instead of express-validator, for a reason 
const testUserModel = require("../models/testUserModel");
//pendingUserModel is a registered user that his email has not yet verified, userModel is a true user
const { pendingUserModel, userModel } = require("../models/userModel");
const categories = require("../categories")
const md5 = require("md5");
const { isMongoId, isMD5, isEmail, escape, unescape } = require("validator");
const getCountries = require("../getCountries")();
const uid = require("../uid");
const ngBanks = require("../ng-banks");
const ejs = require("ejs");
const { compareTwoStrings } = require("string-similarity");
const ipLocation = require("../ipLocation");
const nodemailer = require("nodemailer");
const random = require("random");
const cookieParser = require("cookie-parser");
//codeModel for storing codes that will expire with time, for expiring links and security purposes
const codeModel = require("../models/codeModel");
const commentModel = require("../models/commentModel");
const viewsModel = require("../models/viewsModel");
const likesModel = require("../models/likesModel");
const sharesModel = require("../models/sharesModel");
const articleModel = require("../models/articleModel")
const visitorsModel = require("../models/visitorsModel");

const sharp = (process.env.NODE_ENV === "production") ? require("sharp") : {}


const app = express.Router();
const isProd = process.env.NODE_ENV === "production";

/*
all req.session.
user: user sess
ipLoc: location for a visitor/memeber
form: pending registration 
*/




//====== admin variables

let allowAccountRegistration = true;
let allowEarning = true; //will earn from views
let allowPayment = true; //will earn but will/won't get paid
let currency = "NGN"; // naira
let countryPayment = "Nigerian Naira";
let paymentPerView = 0.013; // naira
let minWithdraw = 1000; // 1k naira
let maxWithdraw = 50000; // 50k naira
let emailAddress = "irokant09@gmail.com"; //for sending mails only
let emailPass = process.env.email_pass;
//email password for sending mail
let contactEmailAddress = "irokant09@gmail.com" //for contacting me only
let adminPhoneNumber = "+234 901 486 4168"
const allAdminEmails = [emailAddress, contactEmailAddress].map(x => x.trim().toLowerCase());




const brandName = "Rooster24";
const autoApproveArticle = true;
const ErrMsg = html("Sorry, something went wrong.", "red");
const confirmEmailInProd = true;
const confirmEmailInDev = false;
const cronJobTimer = (isProd) ? 1000 : 20000;
const pendingUserDeleteTime = 1000 * 60 * 30;
const DaysForAccountDeletion =
  (isProd) ? 1000 * 60 * 60 * 24 : 1000 * 60 * 10;
const onlineLimit = 1000 * 60 * 7; //7mins, after this time, a user will appear offline
const articleValidMaxDay = 30 * 6; //after counting this days,  article will not show to visitors again (1=1day)
const trendingMinViews = 10; //minimum views an article must have before we call it trending, trending must also be recent article.
const trendingMaxDaysAgo = 3; //max days an article must have lasted before we still call it trending no matter its views, (must be recent article).
const mostPopularMinViews = 10; //minimum views an article must have before we call it most popular
const mostPopularMaxDaysAgo = 3; //max days an article must have lasted before we still call it most popular no matter its views, (must be recent article).
const fix = 2; //money digitstoFixed(fix) $0.00

//will turn on this when google gives me adsense 
// const websiteDescription = `We give our visitors latest news and pay our members for posting articles. To be able to post articles, you need to become a member, join ${brandName} to have full access.`;
const websiteDescription = `We give our visitors latest news. To be able to post article and earn, you need to become a member, join ${brandName} to have full access.`;
const uploadDir = "./tmp/uploads/";
const mailErrorMsg = html(`Can't send mail, please retry or <a href="mailto: ${contactEmailAddress}?subject=${brandName} CAN'T SEND MAIL">report</a> this problem.`, "red")

Array.prototype.shuffle = function () {
  this.sort((a, b) => {
    return Math.random() - 0.5
  })
  return this
}

//===========




app.get("/react-fetch", async (req, res) => {
  let users = await userModel.find({}, "-profile_pic")
  setTimeout(() => res.json(users), 5000) // 5sec delay
})









//Restricting some pages for non member
app.use((req, res, next) => {
  let user = req.session && req.session.user;
  isPageAccessible(user, req, res, next)
})






//set cookie
const cObj = ({
  path: "/",
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 31 * 12 * 9999
})
app.use(cookieParser(), (req, res, next) => {
  //article-style = no-thumbnail default
  if (!req.cookies["article-style"]) {
    req.cookies["article-style"] = "no-thumbnail";
    res.cookie("article-style", "no-thumbnail", cObj)
  }
  //user-agent = uid() initialize
  if (!req.cookies["user-agent"]) {
    let _uid = uid(20);
    req.cookies["user-agent"] = _uid;
    res.cookie("user-agent", _uid, cObj)
  }
  //set article-style
  let artStyle = req.query["article-style"];
  if (artStyle && artStyle.trim()) {
    req.cookies["article-style"] = artStyle;
    res.cookie("article-style", artStyle, cObj)
  }
  // console.log(req.cookies)
  next()
})






//set ipLoc
app.use(async (req, res, next) => {
  if (!req.session.ipLoc || (req.session.ipLoc.ip !== req.ip)) {
    let loc;
    if (isProd) {
      loc = ({
        ip: req.ip,
        ... await ipLocation(req)
      })
    }
    else {
      loc = ({
        ip: req.ip,
        country_name: "Nigeria",
        region_name: "Imo",
        time_zone: "Africa/Lagos"
      });
    }
    req.session.ipLoc = loc;
  }
  next()
})






//visitorsModel collect every visitors details everyday
app.use((req, res, next) => {
  let ipLoc = req.session.ipLoc;
  visitorsModel.init(function () {
    new visitorsModel({
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      continent: ipLoc.time_zone,
      country: ipLoc.country_name,
      state: ipLoc.region_name,
      lat: ipLoc.latitude,
      lng: ipLoc.longitude,
      uniqueCode: md5(req.cookies["user-agent"] + moment().tz(ipLoc.time_zone).format("DD/MMM/YYYY")),
      timeUTC: moment().format("DD/MMM/YYYY hh:mm:ssA"),
    }).save(e => null)
  });
  next()
})






//set locals variable
app.use(async (req, res, next) => {
  const user = req.session.user;
  let ipLoc = req.session.ipLoc;
  //===Setting locals===
  res.locals.brandName = brandName;
  res.locals.websiteDescription = websiteDescription;
  res.locals.member = null;
  res.locals.ipLoc = ipLoc;
  res.locals.fix = fix;
  res.locals.isProd = isProd;
  res.locals.currency = currency;
  res.locals.allowPayment = allowPayment;
  res.locals.countryPayment = countryPayment;
  res.locals.minWithdraw = minWithdraw;
  res.locals.maxWithdraw = maxWithdraw;
  res.locals.adminPhoneNumber = adminPhoneNumber;
  res.locals.contactEmailAddress = contactEmailAddress;
  res.locals.user = user;
  res.locals.paymentPerView = paymentPerView;
  res.locals.req = req;
  res.locals.ngBanks = [];
  res.locals.cheerio = cheerio;
  res.locals.escape = escape;
  res.locals.unescape = unescape;
  res.locals.md5 = md5;
  res.locals.uid = uid;
  res.locals.console = console;
  res.locals.convertUnit = convertUnit;
  res.locals.referer = req.headers.referer;
  res.locals.headers = req.headers;
  res.locals.moment = moment;
  res.locals.onlineLimit = onlineLimit;
  res.locals.capitalize = capitalize;
  res.locals.query = req.query;
  res.locals.nation = getCountries;
  res.locals.country = ipLoc.country_name;
  res.locals.state = ipLoc.region_name;
  res.locals.path = req._parsedUrl.pathname;
  //=====not member
  if (!user) {
    res.locals.isMember = false;
    res.locals.isMe = false;
  }
  else {//***member
    res.locals.isMember = true;
    res.locals.isAdmin = user.isAdmin;
    res.locals.isMe = user._id === req.query.user_id || req.query.user_id === undefined;
    res.locals.ngBanks = ngBanks.map(x => {
      return { name: x.name.capitalize() }
    });
  }//***
  next();
})






//logout
app.get("/logout", (req, res) => {
  try {
    logout(req, res)
  }
  catch (e) {
    res.send(ErrMsg)
  }
})





//logout_from_all_devices
app.get("/logout_from_all_devices", (req, res) => {
  try {
    logoutFromAllDevices(req, res, req.session.user._id)
  }
  catch (e) {
    res.send(ErrMsg)
  }
})






//cancel account deletion 
app.get("/cancel_account_deletion", async (req, res) => {
  try {
    let data = await userModel.findOneAndUpdate({ _id: req.session.user._id }, {
      scheduleAccountDeletion: []
    });
    req.session.user = data._doc;
    if (!data.scheduleAccountDeletion[0]) {
      res.redirect("/")
    }
    else {
      res.send(ErrMsg)
    }
  }
  catch (e) {
    res.send(ErrMsg)
  }
})







//check for account deletion schedule and stop the user if sheduled
app.use(async (req, res, next) => {
  try {
    let ptn = req._parsedUrl.pathname
    if (ptn.match(/^\/$|^\/article|^\/profile_pic/i)) {
      //allowed
      next()
      return
    }
    let user = req.session.user;
    if (user) {
      let arr = user.scheduleAccountDeletion;
      if (arr[0]) {
        res.send(html(`
  <h3>Account disabled</h3>
  Your account has been scheduled for deletion.
  It will be deleted <b>${moment(arr[1]).tz(req.session.ipLoc.time_zone).calendar()}</b>. <br/> <br/> Click <a href="/cancel_account_deletion">here</a> to cancel the deletion. <hr/> Or <a href="/logout">logout</a> instead.`, "red"))
        return
      }
    }
    next()
  }
  catch (e) {
    res.send(ErrMsg)
  }
})








//check if members account is disabled, then stops him
app.use(async (req, res, next) => {
  try {
    let user = req.session.user;
    //check if member's account is disabled.
    if (user && user.isDisabledAccount[0] === true) {
      let msg = html(user.isDisabledAccount[1], "red", "<a href='/logout'>Logout</a>");
      //non user can access every profile_page but disabled user cannot access his own
      let path = req._parsedUrl.pathname;
      let reg = /^\/profile_page/i
      if (res.locals.isMe && path.match(reg)) {
        return res.send(msg)
      }
      //null means not a member, though he is a member, reason: mark a disabled account as non member therefore has only access to exactly pages non member has but with different error msg.
      isPageAccessible(null, req, res, next, msg);
      return
    }
    next() //not disabled
  }
  catch (e) {
    res.send(ErrMsg)
  }
})








//update last seen (updates if account is not disabled)
app.use((req, res, next) => {
  try {
    const user = req.session.user;
    if (user) {
      userModel.findOneAndUpdate({ _id: user._id }, { last_seen: Date.now() }, { new: true }, (e, x) => {
        if (e) {
          console.log(e);
          if (!x && req.session) {
            //account does not exist in db but exists in sess, therefore remove it from sess
            delete req.session.user
          }
        }
        //note: we need to put those values to session also, we first check if req.session exists because logout removes it, we do this asynchronously
        else if (req.session && req.session.user) {
          //x.isDisabledAccount = [true,"Your account has been disabled.", time_countdown]
          req.session.user = x._doc;
          req.session.save(e => e && console.log(e))
        }
      });
    }
    next()
  }
  catch (e) {
    res.send(ErrMsg)
  }
})





// PAYMENT middleware responsible for paying members
app.use(async (req, res, next) => {
  try {
    if (allowPayment && req.session.user) {
      const id = req.session.user._id;
      const zone = req.session.ipLoc.time_zone;
      userModel.findById(id, "-profile_pic",
        (e, user) => {
          if (e || user === null) {
            console.log(e || "user not found for viewPayment middleware");
            return
          }
          //earn at daily interval only
          if (user.lastEarnedFromViews < moment.tz(zone).startOf("day").valueOf()) {
            viewsModel.updateMany({
              owner: id,
              earned: false,
              /*timestamp: {
                $lt: moment.startOf("day").valueOf()
              }*/
            }, {
              earned: true
            }, (e, x) => {
              if (e) { console.log(e); return }
              user.balance += x.nModified * paymentPerView;
              // test purpose, earn high money everyday
              //user.balance += random.int(1000, 50000);
              //==
              user.lastEarnedFromViews = moment.tz(zone).valueOf();
              user.save(e => e && console.log(e))
            })
          }
        })
    }
    next()
  }
  catch (e) {
    res.send(ErrMsg)
  }
})








async function getArticles(which, req) {
  const query = req.query;
  const limit = (req.cookies["article-style"] === "thumbnail") ? 5 : 20;
  //***** search ******
  if (which === "search") {
    if (!query.filter || !query.cat) {
      query.filter = "All";
      query.cat = "All";
    }
    //search articles
    let sQuery = ({
      state: "approved",
      timestamp: {
        $gte: moment().subtract(articleValidMaxDay, "days").valueOf()
      }
    });
    if (query.cat !== "All") {
      sQuery.category = query.cat
    }
    if (query.filter === "Today") {
      sQuery.timestamp = {
        $gte: moment().tz(req.session.ipLoc.time_zone).startOf("day").valueOf()
      }
    }
    else if (query.filter === "Recent") {
      sQuery.timestamp = {
        $gte: moment().subtract(3, "days").valueOf()
      }
    }
    //get articles
    let search;
    if (query.filter === "Trending") {
      search = await articleModel.find(sQuery, "-thumb -pics -body").populate("owner", "-profile_pic");
      search = search.filter(x => {
        return x.views.length >= trendingMinViews
      })
    }
    //didn't enter search
    else if (!query.type || !query.search) {
      search = await articleModel.find(sQuery, "-thumb -pics -body").sort({
        timestamp: -1,
      }).limit(limit).populate("owner", "-profile_pic")
    } // entered search
    else {
      search = await articleModel.find(sQuery, "-thumb -pics -body").populate("owner", "-profile_pic");
      function type(x) {
        if (query.type === "title") return x.title.toLowerCase();
        if (query.type === "content") return x.body.toLowerCase();
        if (query.type === "tag") return x.tags.toLowerCase();
      }

      search = search.map(x => {
        return {
          ...x._doc,
          match: compareTwoStrings(query.search.toLowerCase(), type(x))
        }
      })
        .filter(x => {
          if (x.match >= 0.1) return x
        })
        .sort((a, b) => {
          return b.match - a.match
        });
    }
    return search
  }

  // ****** popular ******
  if (which === "popular") {
    let popular = await articleModel.find({
      state: "approved"
    }, "-thumb -pics -body")
      .populate("owner", "-profile_pic");
    let catNum = popular.map(x => x.category.toLowerCase().trim()); //catNum
    popular = popular.filter(x => {
      //handle popular filter
      return x.views.length >= mostPopularMinViews
    });
    query.cat = categories.includes(query.cat) ? query.cat : "Unknown";
    query.filter = (filters.includes(query.filter)) ? query.filter : "Unknown";
    return { popular, catNum }
  }
  // ****** similar ******
  if (which === "similar") {
    let similar = await articleModel.find({
      // category: art.category,
      state: "approved"
    }, "-thumb -pics -body").sort({ timestamp: -1 }).limit(5).populate("owner", "-profile_pic");
    //store this article in session, incase of when a viewer clicks see_more
    return similar
  }
}







app.get("/", async (req, res) => {
  try {
    let search = await getArticles("search", req)
    let { popular, catNum } = await getArticles("popular", req)
    let obj = await getStats(req);
    res.render("blog_home", {
      nav: { cat: categories },
      article: { search, popular },
      ...obj,
      catNum
    })
  }
  catch (e) {
    console.log(e)
    res.send(ErrMsg)
  }
})





//admin page
app.get("/admin_page", (req, res) => {
  res.send(html("Coming Soon", "#05b"))
})






app.get("/see_more_arts/:type/:page", (req, res) => {
  try {
    let type = req.params.type
    let page = req.params.page
    if (isNaN(page)) {
      res.send(html("invalid page.", "red"));
      return
    }
    if (type === "more_filter") {
      if (!req.session.see_more) {
        return res.send(html("Sorry, you session has expired, refresh your page to continue.", "red"))
      }
      res.render("blog_see_more_arts", {
        article: req.session.see_more
      })
    }
    else if (type === "more_popular") {
      if (!req.session.see_more_popular) {
        return res.send(html("Sorry, you session has expired, refresh your page to continue.", "red"))
      }
      res.render("blog_see_more_arts", {
        article: req.session.see_more_popular
      })
    }
    else if (type === "more_similar") {
      if (!req.session.see_more_similar) {
        return res.send(html("Sorry, you session has expired, refresh your page to continue.", "red"))
      }
      res.render("blog_see_more_arts", {
        article: req.session.see_more_similar
      })
    }
    else {
      res.send(ErrMsg)
    }
  }
  catch (e) {
    res.send(ErrMsg)
  }
})





app.use("/register", (req, res, next) => {
  try {
    if (!allowAccountRegistration) {
      res.send(html("Sorry, we are not accepting any new member for now. <br/>Please retry later.", "red"))
      return
    }
    next()
  }
  catch (e) {
    res.send(ErrMsg)
  }
})





app.route("/register")
  //GET
  .get((req, res) => {
    try {
      const ipLoc = req.session.ipLoc
      let defaultVals = { ...default_vals };
      if (getCountries.map(x => x.name).includes(ipLoc.country_name)) {
        defaultVals.country = ipLoc.country_name;
      }
      const yr = Number(moment().tz(ipLoc.time_zone).format("YYYY"));
      defaultVals.year = yr - 25; //current selected year
      res.render("blog_sign_up", {
        months,
        ...defaultVals,
        ...default_errors
      })
    }
    catch (e) {
      console.log(e)
      res.send(ErrMsg)
    }
  })
  //POST
  .post(async (req, res) => {
    capitalizeFields(req.fields);
    const key = uid(20);
    try {
      //test validation
      let data = testUserModel(key, req.fields);
      //check if username and email already used
      let u1 = await userModel.findOne({
        username: req.fields.username
      })
      if (u1) throw { message: "username_1 dup key" };
      let e1 = await userModel.findOne({
        email: req.fields.email
      })
      if (e1) throw { message: "email_1 dup key" };
      /*very important to filter body i.e removing unwanted properties that a user may add to default values in the userModel*/
      let bodyObj = filterBody(req.fields);
      let pic_link = `/default_${bodyObj.gender.toLowerCase()}.png`;
      //should confirm email for production or dev
      if ((isProd && confirmEmailInProd) || (!isProd && confirmEmailInDev)) {
        data = await new pendingUserModel({
          ...bodyObj,
          pic_link,
          pass: md5(bodyObj.pass),
          expires: Date.now() + pendingUserDeleteTime
          //  phone: PN(`+${bodyObj.code.split("+")[1]}${bodyObj.phone}`).getNumber("international"),
        }).save();
        data = data._doc;
        data.subject = `${bodyObj.fname} complete your ${brandName} Registration`;
        data.link = "/register/complete/" + data._id;
        data.pendingUserDeleteTime = pendingUserDeleteTime
        //store form to session for resending email if failed to send. 
        req.session.form = data;
        setTimeout(function () {
          delete req.session.form;
        }, pendingUserDeleteTime);
        sendMail(req, data)
          .then(x => {
            if (x.error) throw x;
            res.render("email_confirm", {
              link: "/register/resend_link",
              email: data.email,
              pendingUserDeleteTime
            })
          })
          .catch(e => {
            res.send(mailErrorMsg);
          })
      }//isProd ends
      else {
        //don't confirm email. Save directly to userModel
        data = new userModel({
          ...bodyObj,
          pic_link,
          pass: md5(bodyObj.pass)
        });
        //make admin
        if (allAdminEmails.includes(data.email)) {
          data.isAdmin = true
        }
        data = await data.save();
        req.session.user = data._doc
        res.redirect("/login")
      }
    }
    catch (e) {
      console.log("====", e, "=====")
      const errors = {};
      if (e.errors) {
        for ({ properties: { path, message } } of Object.values(e.errors)) {
          errors["err_" + path] = message;
        }
      }
      if (e.message.includes("username_1 dup key")) {
        errors.err_username = "This username has been used by someone else."
      }
      if (e.message.includes("email_1 dup key")) {
        errors.err_email = "This email has been used by someone else."
      }
      if (e.message.includes("phone_1 dup key")) {
        errors.err_phone = "This number has been used by someone else."
      }
      res.render("blog_sign_up", {
        months,
        ...default_vals,
        ...default_errors,
        ...errors,
        ...req.fields,
        nation: getCountries,
      })
    }
    finally {
      //delete the testModel, using unique model key from uid string
      delete mongoose.connection.models[key];
    }
  })










app.get("/register/resend_link", (req, res) => {
  try {
    if (!req.session || !req.session.form) {
      return res.status(400).send(ErrMsg);
    }
    sendMail(req, req.session.form)
      .then(x => {
        if (x.error) throw x;
        res.status(200).send("sent");
      })
      .catch(e => {
        res.status(400).send(mailErrorMsg);
      })
  }
  catch (e) {
    res.send(ErrMsg)
  }
})









app.get("/register/complete/:id", async (req, res) => {
  let id = req.params.id;
  if (!isMongoId(id)) {
    return res.send("unknown link")
  }
  pendingUserModel.findById(id, async (e, x) => {
    // console. log(e||x) 
    if (e || x === null) {
      res.send(html("Expired link.", "red"))
      console.log(e || "PendingUserModel» Expired link.");
      return
    }
    await userModel.init();//ensure index
    try {
      delete x._id;
      delete x.__v;
      //make a new member an admin he/her has a particular email
      if (allAdminEmails.includes(x.email)) {
        x.isAdmin = true
      }
      let data = await new userModel({ ...x._doc }).save();
      if (req.session) {
        req.session.destroy(e => e && console.log(e))
      }
      res.render("registration_completed");
      pendingUserModel.deleteOne({ _id: id }, e => e && console.log(e))
    }
    catch (e) {
      console.log(e)
      res.send(ErrMsg)
    }
  })
})









app.get("/register/cancel", async (req, res) => {
  if (req.session && req.session.form) {
    pendingUserModel.deleteOne({ _id: req.session.form._id }, e => e && console.log(e))
    req.session.destroy(e => {
      if (e) {
        console.log(e)
        res.redirect("/register")
      }
      else res.redirect("/register")
    })
    return
  }
  res.redirect("/register")
})









app.route("/login")
  .get((req, res) => {
    res.render("blog_login", {
      ...{ error: "", username: "", pass: "" }
    })
  })
  //POST
  .post(async (req, res) => {
    try {
      capitalizeFields(req.fields);
      let user = await userModel.findOne({
        username: req.fields.username,
        pass: md5(req.fields.pass)
      }, "-profile_pic").orFail();
      req.session.user = user._doc;
      if (req.fields.ajax === "Ajax") {
        res.send({ error: false })
        return
      }
      res.redirect("/")
    }
    catch (e) {
      console.log(e)
      if (req.fields.ajax === "Ajax") {
        res.send({
          error: true,
          msg: "Wrong username or password"
        })
        return
      }
      res.render("blog_login", {
        error: "Wrong username or password",
        ...req.fields,
      })
    }
  })









app.get("/login/forgot_pass", async (req, res) => {
  let obj = {
    success: "",
    email_error: "",
    email: "",
  };
  let email = req.query.email;
  if (email) {
    obj.email = email.trim();
    // not email
    if (!isEmail(email)) {
      obj.email_error = "Invalid email."
    }
    else {
      let user = await userModel.findOne({ email: RegExp("^" + obj.email + "$", "i") });
      // no user found
      if (!user) {
        obj.email_error = "This email is not registered."
      }
      else {
        try {
          //save code which expires at 20mins
          let code = uid(20);
          await new codeModel({
            code,
            email: user.email,
            expires: Date.now() + 1000 * 60 * 20
          }).save();
          obj.link = "/reset_pass/" + code;
          obj.subject = "Reset your " + brandName + " password";
          let x = await sendMail(req, obj, "reset_pass_link.html");
          if (x.error) throw x;
          obj.success = "<b>SUCCESSFUL</b><br>We sent the password reset link to your email <b style='color:#555'>" + obj.email + "</b>. The link expires in 20minutes from now.";
        }
        catch (e) {
          console.log(e)
          obj.email_error = mailErrorMsg
        }
      }
    }
  }
  else if (req.query.sub) {
    obj.email_error = "Email is required."
  }
  res.render("reset_pass", obj)
})








app.route("/reset_pass/:code")
  .get(async (req, res) => {
    const code = req.params.code;
    const x = await codeModel.findOne({ code });
    if (x === null) {
      res.send(html("Expired link", "red"));
      return
    }
    let obj = {};
    obj.pass = "";
    obj.pass_error = "";
    obj.cpass = ""
    obj.cpass_error = ""
    obj.success = ""
    obj.link = "/reset_pass/" + code
    res.render("reset_pass_form", obj)
  })
  //POST
  .post(async (req, res) => {
    let code = req.params.code;
    const x = await codeModel.findOne({ code });
    if (x == null) {
      return res.send("Expired link")
    }
    let obj = {
      pass: "",
      pass_error: "",
      cpass: "",
      cpass_error: "",
      success: "",
      link: "/reset_pass/" + code,
      ...req.fields
    }
    if (!obj.pass) {
      obj.pass_error = "This field is required."
    }
    else if (obj.pass.length < 4) {
      obj.pass_error = "Password length must be at least 4 characters long."
    }
    else if (obj.pass.length > 20) {
      obj.pass_error = "Maximum of 20 characters required."
    }
    if (!obj.cpass) {
      obj.cpass_error = "This field is required."
    }
    else if (obj.cpass !== obj.pass) {
      obj.cpass_error = "This must match with the chosen password."
    }
    //does error exist ?
    if (obj.pass_error || obj.cpass_error) {
      res.render("reset_pass_form", obj)
    }
    else {
      userModel.findOneAndUpdate({
        email: RegExp("^" + x.email + "$", "i")
      }, {
        pass: md5(obj.pass)
      }, { runValidators: true, new: true },
        (e, y) => {
          if (e) {
            console.log(e)
            if (e.errors) {
              obj.pass_error = e.message
            }
            else {
              obj.pass_error = "Error occurred, retry."
            }
            res.render("reset_pass_form", obj)
          }
          else {
            //logout from all devices after reset password     
            logoutFromAllDevices(req, res, y._id, "/login")
          }
        })
    }
  })





//block a user 
app.get("/block/:user_id", async (req, res) => {
  try {
    let user_id = req.params.user_id;
    let user = await userModel.findOneAndUpdate({
      _id: req.session.user._id,
    }, {
      $addToSet: {
        blocked_list: user_id
      }
    }, { new: true });
    req.session.user = user._doc;
    res.redirect(req.header("referer"))
  }
  catch (e) {
    res.send(ErrMsg)
  }
})




//unblock a user 
app.get("/unblock/:user_id", async (req, res) => {
  try {
    let user_id = req.params.user_id;
    let user = await userModel.findOneAndUpdate({
      _id: req.session.user._id,
    }, {
      $pull: {
        blocked_list: user_id
      }
    }, { new: true })
    req.session.user = user._doc;
    res.redirect(req.header("referer"))
  }
  catch (e) {
    res.send(ErrMsg)
  }
})







app.get("/profile_page", async (req, res) => {
  try {
    let id = req.query.user_id;
    if (!id && req.session.user) {
      id = req.session.user._id
    }
    let isId = isMongoId("" + id);
    if (!isId) {
      throw "Unknown user id i.e in /profile_page" + id;
    }
    let member = await userModel.findById(id, "-profile_pic").orFail();
    //check is users account is disabled.
    if (member.isDisabledAccount[0] === true) {
      res.send(html("This account is disabled.", "red"));
      return
    }
    res.render("blog_profile", {
      member,
      DaysForAccountDeletion
    })
  }
  catch (e) {
    console.log(e)
    res.send(ErrMsg)
  }
});





app.post("/update_profile/:type",
  async (req, res) => {
    let data = {};
    const fields = req.fields;
    const type = req.params.type;
    let foundVal = false, foundEmpty = false;
    try {
      //update bank account
      if (type === "bank_account") {
        for (let key in fields) {
          if (key === "account_name" || key === "bank_name" || key === "amount" || key === "account_number") {
            data[key] = fields[key].trim().capitalize()
            if (fields[key].trim()) foundVal = true;
            else foundEmpty = true
          }
        }
        if (foundVal && foundEmpty) {
          throw ({
            errors: true,
            message: "You must supply all fields."
          })
        }
        else if (data.amount < minWithdraw) {
          throw ({
            errors: true,
            message: ` You can only withdrawal minimum of ${currency}${minWithdraw.toLocaleString("en")}.`
          })
        }
        else if (!ngBanks.map(x => x.name.trim().toLowerCase()).includes(data.bank_name.toLowerCase())) {
          throw ({
            errors: true,
            message: `Unknown bank name.`
          })
        }
        else if (isNaN(data.amount)) {
          throw ({
            errors: true,
            message: "Amount must be a valid value."
          })
        }
        else if (data.amount > maxWithdraw) {
          throw ({
            errors: true,
            message: ` You can only withdrawal maximum of ${currency}${maxWithdraw.toLocaleString("en")}.`
          })
        }
        let result = await userModel.findOne({
          _id: req.session.user._id
        });
        result.account_name = data.account_name;
        result.bank_name = data.bank_name;
        result.account_number = data.account_number;
        result.pendingWithdrawal = (data.amount > result.balance) ? [] : [data.amount, "pending", Date.now()];
        await result.save()
        if (data.amount > result.balance) {
          throw ({
            errors: true,
            message: `Insufficient balance ${currency}${Number(result.balance.toFixed(fix)).toLocaleString()}`
          })
        }
        res.json({
          result: "Placed successfully."
        })
      }
      //cancel withdrawal
      else if (type === "cancel_withdrawal") {
        let x = await userModel.updateOne({
          _id: req.session.user._id
        }, { pendingWithdrawal: [] });
        if (x.nModified > 0) {
          res.json({
            result: "Cancelled successfully."
          })
        }
        else {
          throw ({
            errors: true,
            message: "Either you don't have any pending withdrawal or something went wrong."
          })
        }
      }
      else if (type === "edit_profile") {

      }
    }
    catch (e) {
      if (e.errors) {
        res.json({
          error: e.message.replace(/.+\:\s*/, "")
        })
      }
      else {
        res.json("Error occured at the server,  please retry later.");
        console.log(e);
      }
    }
  })







app.post("/upload_profile_pic",
  async (req, res) => {
    // console.log(req.url, req.files, req.headers)
    const file = req.files.img.path;
    const tSize = req.files.img.size;
    try {
      imageSize(file) //is image??
      if (req.files.img.size > bytes("5mb")) {
        throw { error: "Can't upload an image that's more than 5MB size." }
      }
      let picBuffer;
      if (isProd) {
        picBuffer = await compressImage(file, tSize);
      }
      else {
        picBuffer = Buffer.from(fs.readFileSync(file))
      }
      await userModel.updateOne({
        _id: req.session.user._id
      }, {
        profile_pic: picBuffer,
        pic_link: "/profile_pic/" + req.session.user._id
      }, { runValidators: true })
        .orFail()
      res.json({
        data: "/profile_pic/" + req.session.user._id
      });
    }
    catch (e) {
      console.log(e)
      if (e.error) {
        res.json({
          error: e.error
        })
      }
      else {
        res.json({
          error: "Can't upload, please retry.",
          msg: e
        })
      }
    }
    finally {
      deleteFile(file);
    }
  });






app.get("/profile_pic/:id", (req, res) => {
  let id = req.params.id;
  let isIcon = req.query.icon;
  userModel.findById(id, "profile_pic")
    .then(async (data) => {
      let dir = `${process.cwd()}/tmp/download/${uid()}.jpg`;
      if (isIcon && isProd) {
        await sharp(data.profile_pic)
          .resize(200, 200)
          .jpeg({
            quality: 60
          })
          .toFile(dir)
      }
      else {
        fs.writeFileSync(dir, data.profile_pic);
      }
      res.sendFile(dir, e => {
        if (e) console.log(e)
        else {
          deleteFile(dir)
        }
      })
    })
    .catch(e => {
      console.log(e)
      res.send("")
    })
})



/*
console.log(
  escape('(<code \s*class\s*=\s*\".*highlight.*\"\s*>)')
  )
*/


app.route("/publish")
  .get((req, res) => {
    res.render("blog_publish", {
      categories,
    })
  })
  //POST
  .post(async (req, res) => {
    try {
      const user = req.session.user;
      const files = req.files;
      const fields = req.fields;
      //::::process body code tag 
      /*
      let art_body = fields.body; 
      var reg = new RegExp(escape('(<code \s*class\s*=\s*.+highlight.+\s*>)'), "ig")
      art_body = art_body.replace(reg, "$1");
       reg = new RegExp(escape('(<\/code>)'), "ig")
      art_body = art_body.replace(reg, "$1");
      
      let $ = cheerio.load("<div id='Xbody'>"+unescape(fields.body)+"</div>");
      $("div#Xbody code.html *").wrap(`<span class="exclude-44"></span>`);
      fields.body = unescape($("div#Xbody").html());
      $ = cheerio.load("<div id='Xbody'>"+fields.body+"</div>");
      $("div#Xbody code.html *:not(code.html span.exclude-44 *)").wrap(`<span class="include-44"></span>`);
      $("div#Xbody code.html span.include-44").filter(function(){
        $(this).text($(this).html())
      });
      fields.body = $("div#Xbody").html();
      fields.body = unescape(fields.body) ;
      */
      //:::::
      const thumb = ({
        buffer: Buffer.from(fs.readFileSync(files.thumb.path)),
        size: files.thumb.size
      });
      deleteFile(files.thumb.path);
      const pics = ({
        buffers: [],
        sizes: []
      });
      const art_id = new mongoose.Types.ObjectId();
      // for loop
      for (const [key, val] of Object.entries(files)) {
        if (!key.match(/^blob:.+/)) {
          continue;
        }
        if (fields.body.includes(key)) {
          let foundInvalidImage = false, img_size;
          try {
            img_size = imageSize(files[key].path);
          }
          catch (e) {
            foundInvalidImage = true
          }
          if (foundInvalidImage) {
            let violation = "Hack attempt: Tried to upload an invalid image.";
            hackAlert(user, violation)//⚠️⚠️
            throw { imageError: "One of the files you uploaded was not an image, please upload a real image." }
          }
          let i = pics.sizes.length;
          let src = `/article/image/${i}/?art_id=${art_id}`;
          fields.body = fields.body.replace(key, src);
          let $ = cheerio.load("<div id='Xbody'>" + unescape(fields.body) + "</div>");
          $(`img[src="${src}"]`).attr({
            "data-width": img_size.width,
            "data-height": img_size.height
          });
          fields.body = $("div#Xbody").html();
          pics.buffers.push(Buffer.from(fs.readFileSync(val.path)));
          pics.sizes.push(val.size);
          deleteFile(val.path);
        }
      } //loop end

      //==
      let $ = cheerio.load("<div id='Xbody'>" + fields.title.capitalize() + "</div>");
      fields.title = $("div#Xbody").text();
      let data = {
        _id: art_id,
        owner: user._id,
        title: fields.title.trim(),
        category: fields.category.trim(),
        tags: fields.tags.trim(),
        body: fields.body.trim(),
        thumb, pics
      }
      let valObj = {
        validateBeforeSave: true
      };
      //approve admin's article automatically and should not validate it
      if (req.session.user.isAdmin === true) {
        data.state = "approved";
        valObj.validateBeforeSave = false;
      }
      //approve everyone article automatically
      if (autoApproveArticle) {
        data.state = "approved";
      }
      data = new articleModel(data);
      //save article to database
      await data.save(valObj);
      userModel.updateOne({ _id: user._id }, {
        $addToSet: {
          articles: art_id
        }
      }, (e) => e && console.log(e));
      res.send((autoApproveArticle || req.session.user.isAdmin === true) ? "Published" : "Submitted for review")
    }
    catch (e) {
      console.log(e);
      if (e.imageError) {
        res.status(406).send(e.imageError)
      }
      else if (e.errors) {
        let err = Object.values(e.errors)[0].properties.message;
        res.status(406).send(err)
      }
      else {
        res.status(406).send("Submission failed, either server error or you submitted a wrong input.")
      }
      //delete all images when error occurs
      for (let [key, val] of Object.entries(req.files)) {
        deleteFile(val.path);
      }
    }
  })







app.get("/members", async (req, res) => {
  try {
    let members = await userModel.find();
    res.render("blog_members", {
      members,
      ...await getStats(req)
    })
  }
  catch (e) {
    console.log(e);
    res.send(ErrMsg)
  }
})











app.get("/article", async (req, res) => {
  try {
    let aa = req.query.art_id;
    let cc;
    if (aa.includes("-code-")) {
      let d = aa.split("-code-");
      aa = d[0].trim();
      cc = d[1].trim();
    }
    const art_id = aa;
    const code = cc;
    if (!art_id || !isMongoId(art_id)) {
      return res.send(ErrMsg)
    }
    const art = await articleModel.findById(art_id, "-thumb -pics").populate("owner", "-profile_pic")
      .populate({
        path: "comments",
        populate: {
          path: "owner",
          select: "-profile_pic"
        }
      });
    if (art === null) {
      res.send("<h1>404: Page Not found. <br/> The article has been deleted.</h1>".capitalize("center"));
      return
    }
    //art.comments.reverse();

    //set new view if not the owner
    if (art.state === "approved" && (!req.session.user || (art.owner._id + "" !== req.session.user._id + ""))) {
      await viewsModel.init() //ensures index to avoid multiple views from the same device
      let v = new viewsModel({
        owner: art.owner._id,
        art_id: art._id,
        device_id: req.ip //ip address as unique device identity.
      });
      let vid = v._id;
      v.save((e) => {
        if (e && e.code === 11000) {
          return
        }
        else if (e) {
          console.log(e)
        }
        else {
          articleModel.updateOne({
            _id: art_id
          }, {
            $addToSet: {
              views: vid
            }
          }, (e) => e && console.log(e))
        }
      })
    }

    //similar art
    let similar = await getArticles("similar", req)
    /*
    let artTags = art.tags.split(/,\s?/)
    similar = similar.filter(x=>{
       //filter /similar articles
         return x.category === art.category && artTags.map(m=>{
            x.tags.includes(m)
          }).length > 0
    })
    */
    //get total likes
    let liked = false;
    //check if article is liked by me
    let _obj;
    if (req.session.user) {
      _obj = ({
        art_id,
        owner: req.session.user._id
      })
    }
    else {
      _obj = ({
        art_id,
        userAgent: req.cookies["user-agent"]
      })
    }
    let vv = await likesModel.findOne(_obj);
    if (vv !== null) liked = true;
    //only socia media should set shared to true
    if (req.headers["user-agent"].match(/facebookexternalhit|WhatsApp\/|twitter\//i)) {
      sharesModel.updateOne({
        art_id, code
      }, {
        shared: true
      }, () => { });
      //delete stored share that has not been really shared for one day
      sharesModel.deleteMany({
        shared: false,
        timestamp: {
          $lt: moment().subtract(1, "day").valueOf()
        }
      }, e => e && console.log(e));
    }
    let likes = await likesModel.countDocuments({ art_id });
    let shares = await sharesModel.countDocuments({
      art_id,
      shared: true
    });
    let queries = {};
    if ("name" in req.query) {
      queries = req.query
    }
    //pageUrl is new url without commentBox queries, filtered from req.url
    let pageUrl = req.protocol + "://" + req.headers.host + req.url.replace(/&.+$/, "");
    // render
    res.render("blog_article", {
      art,
      similarArt: similar,
      liked,
      likes,
      shares,
      pageUrl,
      //for non-member commentBox
      name: "",
      gender: "",
      email: "",
      website: "",
      ...queries
    })
  }
  catch (e) {
    if (e.code !== 11000) {
      console.log(e)
    }
    res.send(ErrMsg)
  }
})





app.post("/comment_article/:art_id",
  async (req, res) => {
    let art_id = req.params.art_id;
    try {
      //only approved articles can be commented on.
      await articleModel.findOne({
        _id: art_id,
        state: "approved"
      }, "_id").orFail();
      let obj;
      if (req.session.user) {
        obj = ({
          owner: req.session.user._id,
          art_id,
          email: req.session.user.email,
          body: req.fields.comment
        })
      }
      else {
        const fields = req.fields
        if (fields.name.trim() === "") {
          fields.name = "Anonymous";
        }
        capitalizeFields(fields);
        if (!fields.gender) {
          throw { message: "Your gender is required." }
        }
        obj = ({
          isMember: false,
          userAgent: req.cookies["user-agent"],
          art_id,
          name: req.fields.name,
          gender: req.fields.gender,
          email: req.fields.email,
          website: req.fields.website,
          country: req.session.ipLoc.country_name,
          state: req.session.ipLoc.region_name,
          body: req.fields.comment
        })
      }
      const c = new commentModel(obj);
      const cid = c._id;
      await c.save()
      //push to article connents for populate
      let m = await articleModel.updateOne({ _id: art_id }, {
        $addToSet: {
          comments: cid
        }
      })
      if (m.nModified < 1) {
        await commentModel.deleteOne({ _id: cid });
        throw { message: "Something went wrong, you can report this problem." }
      }
      //set up redirect link with necessary queries for non-member fields auto fill
      let link = `/article/?art_id=${art_id}#${cid}`;
      const q = req.fields;
      if ("name" in q && "gender" in q) {
        link = `/article/?art_id=${art_id}&name=${q.name}&gender=${q.gender}#${cid}`;
        if ("email" in q || "website" in q) {
          link = `/article/?art_id=${art_id}&name=${q.name}&gender=${q.gender}&email=${q.email}&website=${q.website}#${cid}`;
        }
      }
      res.redirect(link)
    }
    catch (e) {
      console.log(e);
      if (e.message && e.code !== 11000) {
        res.send(html(e.message.replace(/^.+?\: /, ""), "red"))
        return
      }
      res.send(ErrMsg)
    }
  })







app.get("/like_article", async (req, res) => {
  let art_id = req.query.art_id;
  let isAjax = req.query.ajax;
  let owner = req.session.user ? req.session.user._id : null;
  let userAgent = req.cookies["user-agent"];
  let type = "like";
  const mainObj = {}
  try {
    //only approved articles can be liked.
    await articleModel.findOne({
      _id: art_id,
      state: "approved"
    }, "_id").orFail("Error occured")
    //check if liked
    let val;
    if (req.session.user) {
      val = await likesModel.findOne({
        art_id, owner
      }, "_id");
    }
    else {
      val = await likesModel.findOne({
        art_id, userAgent
      }, "_id");
    }
    //liked
    if (val !== null) {
      type = "unlike";
    }
    //like
    if (type === "like") {
      await likesModel.init();
      let obj;
      if (req.session.user) {
        obj = ({
          owner,
          art_id,
          code: md5(art_id + owner)
        })
      }
      else {
        obj = ({
          art_id, userAgent,
          code: md5(art_id + userAgent)
        })
      }
      await new likesModel(obj).save()
      mainObj.result = "Unlike"
    }
    //unkike
    else {
      let obj;
      if (req.session.user) {
        obj = ({
          owner, art_id,
        })
      }
      else {
        obj = ({
          userAgent, art_id,
        })
      }
      let del = await likesModel.deleteOne(obj);
      if (del.deletedCount > 0) {
        mainObj.result = "Like"
      }
    }
    let count = await likesModel.find({
      art_id,
    });
    count = count.length;
    if (isAjax) {
      mainObj.count = count
      res.json(mainObj)
    }
    else {
      res.redirect("/article/?art_id=" + art_id + "#shareLikes")
    }
  }
  catch (e) {
    mainObj.error = "Server error."
    console.log(e)
    if (isAjax) {
      res.json(mainObj)
    }
    else {
      res.send(ErrMsg)
    }
  }
})






app.get("/share_article/:sociaMedia", async (req, res) => {
  //if not from these social medias then stop
  if (!req.params.sociaMedia.match(/^facebook$|^whatsapp$|^twitter$/)) {
    return res.send(ErrMsg)
  }
  const code = uid(20);
  const art_id = req.query.art_id
  const _continue = req.query.continue + "-code-" + code
  try {
    //only approved articles can be shared with this button.
    await articleModel.findOne({
      _id: art_id,
      state: "approved"
    }, "_id").orFail("Article not found, or trying to share article that's not approved.")
    await new sharesModel({
      art_id, code
    }).save();
    res.redirect(_continue)
  }
  catch (e) {
    console.log(e);
    res.send("Error occurred, cannot share article please retry later.")
  }
})







app.get("/all_articles", async (req, res) => {
  let owner_id = req.query.owner_id;
  owner_id = owner_id ? owner_id : req.session.user._id;
  let art = await articleModel.find({
    owner: owner_id
  }, "-pics -body").populate("owner views", "-profile_pic");
  art.reverse()
  res.render("blog_all_articles", {
    article: art
  })
})







app.route("/article/image/:prop")
  .get(async (req, res) => {
    try {
      let prop = req.params.prop;
      let art_id = req.query.art_id;
      let isIcon = req.query.icon == 1;
      let filter = (prop === "thumb") ? "thumb" : "pics";
      let data = await articleModel.findOne({
        _id: art_id,
      }, `-_id ${filter}`).orFail();
      let dir = `${process.cwd()}/tmp/download/${uid()}.jpg`;
      let buffer;
      if (prop === "thumb" && isIcon && isProd) {
        await sharp(data.thumb.buffer)
          .resize(200, 200)
          .jpeg({
            quality: 35
          })
          .toFile(dir)
      }
      else if (prop === "thumb") {
        fs.writeFileSync(dir, data.thumb.buffer);
      }
      else {
        fs.writeFileSync(dir, data.pics.buffers[prop]);
      }
      res.sendFile(dir, (e) => {
        if (e) console.log(e);
        deleteFile(dir);
      })
    }
    catch (e) {
      console.log(e)
      res.send(ErrMsg)
    }
  })







app.all("/delete_comment/:art_id/:cid", async (req, res) => {
  let art_id = req.params.art_id
  let cid = req.params.cid;
  try {
    let obj;
    if (req.session.user) {
      obj = ({
        _id: cid,
        $or: [{
          owner: req.session.user._id
        }, {
          userAgent: req.cookies["user-agent"]
        }]
      })
    }
    else {
      obj = ({
        _id: cid,
        userAgent: req.cookies["user-agent"]
      })
    }
    let x = await commentModel.deleteOne(obj);
    if (x.deletedCount === 0) {
      hackAlert(req.session.user, "Tried to delete a comment that's not his/her own")
      throw { ...x, info: "can't delete comment" }
    }
    //push to article connents for populate
    articleModel.updateOne({ _id: art_id }, {
      $pull: {
        comments: cid
      }
    }, (e) => e && console.log(e));
    if (req.fields.ajax === "Ajax") {
      res.send({ error: false });
      return
    }
    res.redirect("/article/?art_id=" + art_id + "#commentFocus")
  }
  catch (e) {
    console.log(e)
    if (req.fields.ajax === "Ajax") {
      res.send({ error: true });
      return
    }
    res.send(html("Sorry, something went wrong.", "red"))
  }
})






app.route("/delete_article")
  .get(async (req, res) => {
    try {
      let art_id = req.query.art_id;
      //validate art_id
      if (!art_id || !isMongoId(art_id)) {
        console.log("bad id")
        return res.send(ErrMsg)
      }
      await deleteArticle(req.session.user, art_id, "one")
      res.redirect("/all_articles")
    }
    catch (e) {
      console.log(e)
      res.send(ErrMsg)
    }
  })







app.post("/delete_account",
  async (req, res) => {
    //NOTE: this schedules account deletion only i.e doesn't delete account immediately
    try {
      let pass = md5(req.fields.pass);
      const user = req.session.user;
      let data = await userModel.findOneAndUpdate({
        _id: user._id,
        pass,
      }, {
        scheduleAccountDeletion: [true, Date.now() + DaysForAccountDeletion]
      }, { runValidators: true, new: true }).orFail("Wrong password");
      if (data.scheduleAccountDeletion[0]) {
        res.send({
          error: false,
          DaysForAccountDeletion
        })
      }
      else {
        throw "something went wrong."
      }
    }
    catch (e) {
      // console.log(e)
      if (typeof e === "string") {
        res.send({ msg: e, error: true })
      }
      else {
        res.send({ msg: "Something went wrong", error: true })
      }
    }
  })






/*====== END =======*/







// *** CRON JOB ***
setInterval(function () {
  //must run when mongoose is connected
  if (mongoose.connection._readyState === 1) {
    //expires a pending registration by deleting it
    pendingUserModel.deleteOne({
      expires: {
        $lte: Date.now()
      }
    }, e => e && console.log(e, "⚠️⚠️Can't delete pending registration.⚠️⚠️"))
    //expires a code by deleting it
    codeModel.deleteMany({
      expires: {
        $lte: Date.now()
      }
    }, (e) => e && console.log(e, "can't delete codeModel"))
    //delete account
    userModel.find({
      scheduleAccountDeletion: {
        $in: [true]
      }
    }, (e, users) => {
      if (e) {
        console.log(e)
        return
      }
      if (users.constructor !== Array) return;
      users.forEach(user => {
        if (Date.now() >= user.scheduleAccountDeletion[1]) {
          userModel.deleteOne({
            _id: user._id
          }, e => console.log(e))
          deleteArticle(user, null, "all")
        }
      })
    });
    //
  }
}, cronJobTimer);

// ******




async function deleteArticle(user, art_id, type) {
  //deleting one article only
  if (type === "one") {
    await articleModel.deleteOne({
      _id: art_id,
      owner: user._id
    });
    await userModel.updateOne({ _id: user._id }, {
      $pull: {
        articles: art_id
      }
    });
    await viewsModel.deleteMany({ art_id });
    await sharesModel.deleteMany({ art_id });
    await likesModel.deleteMany({ art_id });
    await commentModel.deleteMany({ art_id });
  }
  //recursion delete all when user deletes his account
  else if (type === "all") {
    let arr = await articleModel.find({
      owner: user._id
    }).select("_id").exec();
    arr.forEach(({ _doc: { _id: art_id } }) => {
      deleteArticle(user, art_id, "one")
    })
  }
}




/*
userModel.update({}, {
    $addToSet: {
      articles: "60a881551a5db6127ef5f4d3"
    }})
    .then(x=>{
      console.log(x, "push")
    })
    .catch(e=>{
      console.log(e,"cant pull")
    })


userModel.find({}).select("_id").exec()
.then((x)=>{
  console.log(x)
})
.catch(e=>{
  console.log(e)
})
*/




async function compressImage(file, tSize, type = "buffer") {
  let qty
  if (tSize > bytes("2mb")) {
    qty = 5
  }
  else if (tSize > bytes("1.5mb")) {
    qty = 7
  }
  else if (tSize > bytes("1mb")) {
    qty = 10
  }
  else if (tSize > bytes("500kb")) {
    qty = 30
  }
  else if (tSize > bytes("200kb")) {
    qty = 40
  }
  else if (tSize > bytes("100kb")) {
    qty = 60
  }
  else {
    qty = 100
  }
  let picBuffer = await sharp(file)
    .resize(600, 600)
    .jpeg({
      quality: qty
    })
    .toBuffer();
  return picBuffer;
}







function isPageAccessible(user, req, res, next, acctMsg) {
  let path = req._parsedUrl.pathname;
  //restrict a member from these pages
  if (user && path.match(/^\/login|^\/register|^\/\.\./i)) {
    return res.send(`<h1 style='color: red;  font-family: arial'><center><br>
  Restricted page <br><br>Please logout if you want to access this page.</h1>`)
  }
  //non-member can only access these pages
  else if (!user && !path.match(/^\/$|^\/article|^\/register|^\/logout|^\/login|^\/members|^\/profile_p|^\/all_articles|^\/see_more_arts|^\/share_article|^\/reset_pass|^\/comment_article|^\/delete_comment|^\/like_article/i)) {
    //for disabled acct
    if (acctMsg) {
      res.send(msg);
    }
    else {
      res.redirect("/login")
    }
    return
    /*`<h1 style='color: red;  font-family: arial'><center><br>
    Restricted page
    <br><br> 
    Please login to continue. 
    <br> 
    You can refresh your homepage to see login link.</center></h1>`*/
  }
  next()
}





function logout(req, res, redirect = true) {
  if (!req.session) return;
  req.session && req.session.destroy((e) => {
    if (e) {
      console.log(e);
      res.send(ErrMsg)
    }
    else if (redirect) res.redirect("/")
  })
}



function logoutFromAllDevices(req, res, myId, link = "/") {
  let store = req.sessionStore;
  store.all(async (e, _sess) => {
    if (e) {
      console.log(e);
      res.send("Unable to logout")
      return
    }
    new Promise((rs, rj) => {
      _sess.forEach((sess, i) => {
        if (sess.user && sess.user._id + "" === myId + "") {
          store.destroy(sess.id, (e) => {
            e && console.log(e)
          })
        }
      });
    });
    logout(req, res, false);
    if (link) res.redirect(link)
  })
}





function convertUnit(unit, f = 2) {
  let num = unit;
  if (unit < 1000) return num;
  else if (unit < 1000000) num = (unit / 1000).toFixed(f) + "K";
  else if (unit < 1000000000) num = (unit / 1000000000).toFixed(f) + "M";
  else if (unit < 1000000000000) num = (unit / 1000000000).toFixed(f) + "B";
  else num = (unit / 1000000000).toFixed(f) + "T";
}





function deleteFile(path) {
  if (typeof path === "string" && path.trim() && fs.existsSync(path)) {
    fs.unlink(path,
      (e) => {
        e && console.log(e)
      })
  }
}







async function getStats(req) {
  visitorsModel.deleteMany({
    timestamp: {
      $lt: moment().subtract(2, "days").valueOf()
    }
  }, (e) => e && console.log(e))
  let totalArticles = await articleModel.countDocuments({ state: "approved" });
  let totalVisitorsToday = await visitorsModel.countDocuments({
    timestamp: {
      $gte: moment().tz(req.session.ipLoc.time_zone).startOf("day").valueOf()
    }
  });
  let totalMembers = await userModel.estimatedDocumentCount();
  let allMembers = await userModel.find();
  let activeMembers = allMembers.filter(m => {
    if ("last_seen" in m) {
      return onlineLimit > (Date.now() - m.last_seen);
    }
  }).length;
  return { totalArticles, totalMembers, activeMembers, totalVisitorsToday };
}





function filterBody(body, defaults = default_vals) {
  //filter out only wanted properties
  let obj = {};
  for (let key in body) {
    if (key in defaults)
      obj[key] = body[key];
  }
  return obj;
}








function capitalizeFields(body) {
  //  console.log(body)
  for ([key, val] of Object.entries(body)) {
    if (key != "pass" && key != "cpass" && val.constructor === String) {
      body[key] = val.trim().capitalize();
    }
  }
}






async function sendMail(req, obj, htmlFile = "email_mail.html") {
  return new Promise(async (resolve, reject) => {
    htmlFile = "./client/views/" + htmlFile
    try {
      let transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailAddress,
          pass: emailPass
        }
      });
      let msg = await transport.sendMail({
        from: `${brandName} <irokant09@gmail.com>`,
        to: obj.email,
        subject: obj.subject,
        html: await ejs.renderFile(htmlFile, {
          brandName, ...obj,
          link: "http://" + req.headers.host + obj.link,
          url: "http://" + req.headers.host
        })
      });
      // console.log("===Sent registration mail successfully.===");
      resolve({ error: 0, msg })
    }
    catch (e) {
      console.log("CANT SEND MAIL ", e)
      reject({ error: 1, msg: e })
    }
  })
}






function cap(tag = "") {
  let reg = /.*function\s+|\(.+$/g
  if (tag.constructor !== String) return console.log(`Argument must be a string, you entered ${tag.constructor.toString().replace(reg, "")}`);
  tag = tag ? tag.replace(/[<>/]/g, "") : "";
  let tags = tag ? `<${tag}>` : "";
  let tage = tag ? `</${tag}>` : "";
  let x = this.split(""), arr = [], str;
  x.forEach((a, i, e) => {
    if (i === 0 || e[i - 1] === " ") {
      arr.push(a.toUpperCase())
    }
    else {
      arr.push(a.toLowerCase())
    }
  })
  str = arr.join("")
  str = `${tags}${str}${tage}`;
  return str
}



String.prototype.capitalize = cap;



function capitalize(x) {
  return x.capitalize()
}


function html(x, c, y = "", z = "") {
  return `
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 </head>
 <body style="padding: 10px">
  <center style="font-family:arial;color:${c}">${x}</center>
  <center style="font-family:arial;color:${z}">${y}</center>
  </body>
  `
}




function hackAlert(user, violation) {
  console.log(user.username, violation + "⚠️⚠️");
}





const default_vals = { username: "", fname: "", lname: "", gender: "", date: "", month: "august", year: "", email: "", country: "Nigeria", state: "", phone: "", code: "", pass: "", cpass: "" };

const default_errors = { err_username: "", err_fname: "", err_lname: "", err_gender: "", err_date: "", err_month: "", err_year: "", err_email: "", err_country: "", err_state: "", err_code: "", err_phone: "", err_pass: "", err_cpass: "" };

const months = "january,february,march,april,may,june,july,august,september,october,november,december".split(",");

const filters = "Trending, Today, Recent, All, Tags, Title/Content, Publisher".split(/,\s+/);




// console.log(getCountries)




module.exports = app;

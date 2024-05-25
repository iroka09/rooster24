
const express = require("express");
const mongoose = require("mongoose");
const { pendingUserModel } = require("./models/userModel");
const path = require("path");
const { escape } = require("validator");
const ROUTERS = require("./routes/routers")
const ejs = require("ejs");
const bytes = require("bytes");
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');
const expFormidable = require("express-formidable");
const chalk = require("chalk")
// const helmet = require("helmet")
const cors = require("cors")
require("dotenv/config");

//process.env.NODE_MODULES_CACHE = false; 

const app = express();
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 8080;
const uploadDir = path.join(process.cwd(), "tmp/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}


const RedisStore = connectRedis(session)
//Configure redis client
const redisClient = redis.createClient(
  isProd ? {
    host: process.env.redis_uri,
    port: process.env.redis_port,
    password: process.env.redis_pass
  } : undefined
);


let rn = true;
redisClient.on('connect', function () {
  console.log(chalk.green('Connected to redis successfully'));
  rn = true
});
redisClient.on('error', function (err) {
  rn && console.log(chalk.yellow('Could not establish a connection with redis. ' + err));
  rn = false;
});

app.listen(PORT, (e) => {
  console.log(e || "Listening on port " + PORT)
})

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blog";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}, (e) => {
  console.log(e || chalk.green("Mongodb connected."));
})

app.set("views", "client/views");
app.set("view engine", "html")
app.engine("html", ejs.renderFile);


//cors
app.use(cors({
  credentials: true,
}))


//REDIRECT TO HTTPS (SECURED)
app.use(function (req, res, next) {
  if (isProd && req.protocol === "http") {
    app.enable("trust proxy");
    res.redirect("https://" + req.header("host") + req.url);
    return
  }
  next();
})


app.use("/", express.static("./client/static", {
  dotFiles: "ignore"
}))


//Configure session middleware
app.use(session({
  store: new RedisStore({
    client: redisClient
  }),
  name: "_sess_",
  secret: isProd ? process.env.sess_secret : "test_secret",
  rolling: true,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "strict",
    secure: isProd, // if true only transmit cookie over https
    httpOnly: true, // if true prevent client side JS from reading the cookie 
    maxAge: 1000 * 60 * 60 * 24, // session max age in miliseconds
  }
}))


app.use("/", expFormidable({
  uploadDir: "tmp/uploads",
  keepExtensions: true,
  maxFileSize: bytes("50mb")
}));


app.use(ROUTERS);


app.use("*", (req, res) => {
  res.send("<center><h2>404: PAGE NOT FOUND.</h2></center>")
})


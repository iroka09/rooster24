const express = require("express");
const fs = require("fs");
const bytes = require("bytes");
const cors = require("cors");
const moment = require("moment-timezone");
const expFormidable = require("express-formidable");
const getCountries = require("./server/getCountries")();

//console.log(moment("29/02/2020", "DD/MM/YYYY").format("DD-MMMM-YYYY"))

/*
const app = express();
const server = http.createServer(app);
const PORT = 8000;


server.listen(PORT, (e)=>{
  console.log(e||"Listening on port "+PORT)
})

app.use(cors({
  credentials: true
}))
*/


//const dir =  "/sdcard/nodejs-uploades";

/*
app.use(express.static("./build", {
  dotFiles: "ignore"
}))


app.use(expFormidable({
  uploadDir: dir,
  multiples: true, 
  keepExtensions: true, 
  maxFileSize: bytes("300mb")
}));


app.get("/json", (req, res)=>{
  try{
  getCountries.length = 3
  setTimeout(function() {
    res.status(200)
    res.send(getCountries)
  }, 3000);
  }
  catch(e){
    console.log(e)
    res.send({
      error: true
    })
  }
})



app.post("/file", (req, res)=>{
  try{
  fs.renameSync(req.files.img.path, dir+"/"+req.files.img.name)
  res.send("done")
  }
  catch(e){
  console.log(req.files, "\n=======  ")
    console.log(e)
  }
})


function deleteFile(path){
if(typeof path === "string" && path.trim() && fs.existsSync(path)){
  fs.unlink(path,
    (e)=>{
      e && console.log(e)
    })
  }
}
*/


/*
const size = require("image-size");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const ck = require("chalk");

const zlib = require("zlib");
const util = require("util");
const cheerio = require("cheerio");
const {isMongoId} = require("validator");

const {clubModel, playerModel} = require("./testModel");

let html = fs.readFileSync("/sdcard/sitemap.txt").toString();

`<url>
  <loc>https://rooster24.herokuapp.com/delete_article/?art_id=60b691904a618300155a6383&amp;referer=</loc>
  <lastmod>2021-06-06T21:44:34+00:00</lastmod>
  <priority>0.51</priority>
</url>
`

function cc(){
  
let $ = cheerio.load(html);

$("loc:contains('/?')").parents("url").remove();

$("urlset").wrap("<div>");

html = $("div").html()

html = html.replace(/\n{2,}/g, "\n")
fs.
writeFile("/sdcard/_sitemap.txt", html, (e)=>{
  console.log(e||"Done")
})

return 

}

cc()
*/

/*
let tokyo = moment().tz("asia/tokyo").format();

let york = moment.tz("2021-05-30T00:00:00+00:00","america/new_york").format();


let lagos = moment().format();

console.log(
"tokyo: ", tokyo,
"\nyork: ", york,
"\nlagos: ", lagos
)



let source = "/storage/sdcard0/Xender/audio/Alan_Walker_-_Faded.mp3", 
dest = "/sdcard/1_test.jpg";




app.listen(8000, (e)=>console.log(e||"\nRunning on port: 8000"));




mongoose.connect("mongodb://localhost:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (e)=> console.log(e||"mongo connected\n"))

*/


/*

try {
let source1 = "/sdcard/ALL IN ONE.docx";

let dest1 = "/sdcard/zlib_1.zlib";

let source2 = "/storage/sdcard0/Xender/Greenland (2020) (NetNaija.com).mp4";

let dest2 = "/sdcard/zlib2.zip";

let gZip = zlib.createGzip();

let gunZip = zlib.createGunzip();

let readStream = 
fs.createReadStream(source1);

let writeStream = 
fs.createWriteStream(dest1);

readStream.pipe(gZip).pipe(writeStream)

writeStream.on("finish", function(){
  console.log("Done")
})


}
catch(e){
  console.log(e)
}








const app = express();

let uploadDir = process.cwd()+"/tmp/uploads";


app.use(Form({
    uploadDir,
    multiples: true,
    keepExtensions: true, 
    maxFileSize: bytes("100kb")
}), (req, res, next)=>{
  if(!req.fields){
    res.send("Field required")
    return 
  }
  next()
})




app.post("/", (req, res)=>{
  console.log(5)
    res.send("done")
})


app.post("/set/club", async(req,res)=>{
clubModel(req.fields).save()
.then(x=>{
  res.send(x)
})
.catch(e=>{
  res.send(e.message)
  })
});



app.post("/set/player", async(req,res)=>{
let player = new playerModel(req.fields);
let id = player._id; 
player.save()
.then(async(x)=>{
  try{
  x = await clubModel.findOneAndUpdate({_id: x.club},
    {
      $push: {
        players: id
      }
    }, {new: true, runValidator:true})
  res.send(x)
  }
  catch(e){
    res.send(e)
  }
})
.catch(e=>{
  res.send(e.message)
  })
});



app.post("/get/club", async(req,res)=>{
clubModel.find(req.fields).populate({
  path: "players",
  select: "name -_id",
  populate: {
    path: "club",
    select: "name -_id"
  }
}).exec()
.then(x=>{
  res.send(x)
})
.catch(e=>{
  res.send(e)
  })
});


app.post("/get/player", async(req,res)=>{
playerModel.find(req.fields).populate("club", "name -_id").exec()
.then(x=>{
  res.send(x)
})
.catch(e=>{
  res.send(e)
  })
});



app.post("/delete/player", async(req,res)=>{
try{
const x = await playerModel.deleteMany(req.fields);
res.send(x)
    }
    catch(e){
        console.log(e)
        res.send(e)
    }
});



app.post("/delete/club", async(req,res)=>{
try{
const x = await clubModel.deleteMany(req.fields);
res.send(x)
    }
    catch(e){
        console.log(e)
        res.send(e)
    }
});
*/
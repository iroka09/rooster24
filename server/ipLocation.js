const fetch = require("node-fetch");



module.exports = async function(req){
try{
let ip = (process.env.NODE_ENV==="production")?req.ip:"105.112.107.107"; 
let url1 = `https://freegeoip.live/json/${ip}`;
// let url2 = `http://api.ipstack.com/${ip}?access_key=${process.env.ipstack_access_key}`;
let geo1 = await fetch(url1);
// let geo2 = await fetch(url2);
geo1 = await geo1.json();
// geo2 = await geo2.json();
// console.log(geo1, geo2)
/*
let obj =  {timeZone: geo1.time_zone}
let tm = new Date().toLocaleTimeString("en-us", obj)
tm = new Date().toLocaleDateString("en-gb", obj)+" "+tm;
let geo = {...geo2, ...geo2.location, ...geo1, current_time:tm, languages: geo2.location.languages.map(x=>x.name).join(", ")}
return geo;
*/
return geo1; 
  }
 catch(e){
     console.log("ipLocation can't fetch data")
     return {error:true}
 }
}
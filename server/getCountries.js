
const countries = require("countryjs");
const {flag} = require("country-emoji");

const arr = countries.all().filter(x=>{
  if(x.name && x.name.trim() && x.callingCodes && x.callingCodes[0].trim() && x.provinces && x.provinces[0].trim() && x.altSpellings && x.altSpellings[0].trim()) {
     return true;
  }
}).map(x=>{
let name = x.name.replace(/^The\s+/,"");
  return  {
      name, 
      flag: flag(x.altSpellings[0]) || flag(x.name) || "❗️",
      code: x.callingCodes[0], 
      states: x.provinces
  }
}).sort((b,a)=>{
if(a.name>b.name) return -1;
 return 1
});



module.exports = ()=> arr
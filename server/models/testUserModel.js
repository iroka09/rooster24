
const mongoose = require("mongoose");
const {isEmail, isInt} = 
require("validator");
const moment = require("moment");
//const PN=require("awesome-phonenumber");
const getCountries = require("../getCountries")()





const months = "January,February,March,April,May,June,July,August,September,October,November,December".split(",");










module.exports = async function(key, body){
let x = mongoose.model(key, {
    username: {
        type: String,
        required:[true, "This field is required."],
        match: [/^[A-Z][a-z]+\d+$/, "Invalid username."],
        maxlength: [10, "Username must not be more than 10 characters long."],
        minlength: [4, "Username must be at least 4 characters long."]
    },
    fname: {
        type: String,
        required:[true, "This field is required."],
        match: [/^[A-Z][a-z]+$/, "Wrong name, please enter a valid name."],
        maxlength: [15, "Name must not be more than 15 characters long."],
        minlength: [2, "Name must be at least 2 characters long."]
    },
    lname: {
        type: String,
        required:[true, "This field is required."],
        match: [/^[A-Z][a-z]+$/, "Wrong name, please enter a valid name."],
        maxlength: [15, "Name must not be more than 15 characters long."],
        minlength: [2, "Name must be at least 2 characters long."]
    },
    gender: {
        type: String,
        required:[true, "This field is required."],
        match: [/^Male$|^Female$/, "Invalid gender."]
    },
    
    date: {
        type: Number,
        required:[true, "Date field is required."],
        validate: [(d)=>{
let m = body.month, y = body.year;
return moment(`${Number(d)}/${m}/${y}`, "D/MMMM/YYYY", true).isValid()
}, "Please enter a valid date."]
    },
    
    month: {
        type: String,
        required:[true, "Month field is required."],
        validate: [(x)=>months.includes(body.month), "Invalid month."]
    },
    
    year: {
        type: Number,
        required:[true, "Year field is required."],
        validate: [(x)=>{
let d = new Date().getFullYear();
return isInt(`${x}`,{min:d-150,max:d-5})
}, "Invalid year."]
    },
    
    email: {
        type: String,
        lowercase: true, 
        required:[true, "Email is required."],
        validate: [isEmail, "Invalid email."]
    },
    
    country: {
    type: String,
    required:[true, "This field is required."],
    validate: [(x)=>{
    return getCountries.map(i=>i.name.toLowerCase()).includes(x.toLowerCase());
}, "Unknown country."]
    },
    
    state: {
    type: String,
    required:[true, "This field is required."],
    validate: [(x)=>{
    return getCountries.map(i=>{
if(body.country.toLowerCase() === i.name.toLowerCase()){
        return i.states.map(n=>n. toLowerCase());
    }
 }).flat().includes(body.state.toLowerCase());
}, "Unknown state."]
    },
   /* 
    code: {
    type: String,
    required:[true, "Calling code is required."],
    validate: [(x)=>{
    x = x.split("+")[1];
return getCountries.map(x=>x.code).includes(x);
}, "Invalid calling code."]
    },
    
    phone: {
        type: String,
        required:[true, "Phone number is required."],
        match: [/^\d{5,16}$/, "Invalid phone number."],
        validate: [(x)=>{
        let c = body.code.split("+")[1];
let p = `+${c}${x}`;
return PN(p).isValid()
}, `Invalid phone number, check the number and retry.`]
    },
    */
    pass: {
    type: String,
    required:[true, "This field is required."],
    minlength: [4, "Password must be at least 4 characters long."],
    maxlength: [20, "Maximum of 20 characters required."],
    },
    
    cpass: {
    type: String,
    required:[true, "This field is required."],
    validate: [(x)=>{
    return x === body.pass
}, "This must match with your chosen password."]
    },
});
x = await x.validate(body);
return x; 
}

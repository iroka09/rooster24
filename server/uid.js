
function num(n=10){
let arr = [...new Array(n)];
arr = arr.map(x=>{
    return (Math.random()*36 | 0)
           .toString(36)
  })
return arr.join("");
}


module.exports = num
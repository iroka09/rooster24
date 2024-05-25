

let arr = "Nature, Sports, Politics, Crime, Gambling, Culture, Religion, Celebrities, Flirting, Fashion, Games, Comedy, Literature, Lifestyle, Art, Graphics, Science, Technology, Electronics, Relationship, Jobs, Career, Business, Investment, Education, Autos, Health, Travel, Family, Food, Pets, Agriculture, Jokes, TV/Movies, Events, Coding, Webmasters"
.split(/,\s+/).sort((a,b)=>{
  if(b>a) return -1;
  return 1
});
arr.unshift("All")
//console.log(arr)
module.exports = arr
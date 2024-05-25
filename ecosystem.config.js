const isProd = process.env.NODE_ENV==="production";

module.exports = {
  apps : [{
    name: "blog",
    script: "./server/server.js",
    watch: ["./server", "./*.js", "./node_modules"], 
    instances: (isProd)? 4 : 2,
  //  exec_mode: "fork"||"cluster",
    env: {
      NODE_ENV: "development",
      NODE_MODULES_CACHE: false
    },
    env_production: {
      NODE_ENV: "production",
      NODE_MODULES_CACHE: false
    }
  }]
}
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "users",
      script: "./users/index.js",
    },
    {
      name: "astrologer",
      script: "./astrologers/index.js",
    },
    {
      name: "banner",
      script: "./banners/index.js",
    },
    {
      name: "vendor",
      script: "./vendor/index.js",
    },
    {
      name: "wallet",
      script: "./wallets/index.js",
    },
    {
      name: "communication",
      script: "./communication/index.js",
    },
    {
      name: "welcome",
      script: "./welcome/index.js",
    },
     {
       name: "product",
       script: "./product/index.js",
    },
   
  ],
};

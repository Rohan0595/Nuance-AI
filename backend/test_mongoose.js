require("dotenv").config();
const mongoose = require("mongoose");
const { User } = require("./models");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ainews")
  .then(async () => {
    try {
       console.log("Creating user 1");
       await User.create({ name: "User 1234", phone: "+1112223333" });
       console.log("Creating user 2");
       await User.create({ name: "User 5678", phone: "+9998887777" });
       console.log("Mongoose test SUCCESS.");
    } catch(e) {
       console.log("Mongoose error:", e.message);
    }
    process.exit(0);
  });

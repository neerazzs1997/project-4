const mongoose = require("mongoose");
const shortId = require("shortid");
const UrlSchema = new mongoose.Schema(
  {
    urlCode: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },

    longUrl: {
        type:String,
      required: true,
    },

    shortUrl: {
    type:String,
      unique: true,
    

    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("url", UrlSchema);

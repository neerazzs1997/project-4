//  const mongoose = require("mongoose")
const UrlModel = require("../models/UrlModel");
const validUrl = require("valid-url");
const shortid = require("shortid");
const redis = require("redis")
const { promisify } = require("util");


const isValid = function (value) {
  if (typeof value === "undefined" || typeof value == "null") {
    return false;
  }

  if (typeof value === ("string" || "Array") && value.trim().length > 0) {
    return true;
  }
};

isvalidRequesbody = function (requestbody) {
  if (Object.keys(requestbody).length > 0) {
    return true;
  }
};

const baseUrl = "http:localhost:3000";


//Connect to redis
const redisClient = redis.createClient(
  16368,
  "redis-16368.c15.us-east-1-2.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Y52LH5DG1XbiVCkNC2G65MvOFswvQCRQ", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


// // Connection setup for redis
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const createUrl = async function (req, res) {
  try {
    const requestbody = req.body;

    if (!isvalidRequesbody(requestbody)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide some data" });
    }

    const { longUrl } = requestbody;

    if (!isValid(longUrl)) {
      return res
        .status(400)
        .send({ status: false, msg: "please provide longUrl" });
    }

    // // check the base url here
    // if (!validUrl.isWebUri(baseUrl)) {
    //   return res.status(401).send("Invalid base URL");
    // }

    // // now we generate the urlcode
    const urlCode = shortid.generate();

    if (validUrl.isWebUri(longUrl)) {
      /* The findOne() provides a match to only the subset of the documents 
            in the collection that match the query. In this case, before creating the short URL,
            we check if the long URL was in the DB ,else we create it.
            */

      let url = await UrlModel.findOne({ longUrl });

      
      // url exist and return the respose
      if (url) {
        return res.send(url);
      } else {
        // join the generated short code the  base url
        const shortUrl = baseUrl + "/" + urlCode;

        // invoking the Url model and saving to the DB
        url = new UrlModel({
          longUrl,
          shortUrl,
          urlCode,
          date: new Date(),
        });
        await url.save();

        // // setting in cache --> new entries
        // await SET_ASYNC(`${urlCode}`, JSON.stringify(urlCode));
        // await SET_ASYNC(`${longUrl}`, JSON.stringify(longUrl));

        return res.status(200).send({ data: url });
      } 
    }
  } catch (err) {
    return res.status(500).send({ status: true, error: err.message });
  }
};



const getUrl = async function (req, res) {
  try {
    const url = await UrlModel.findOne({urlCode:req.params.urlCode})
    if(url){
      return res.status(302).redirect(url.longUrl)
    }else{
      return res.status(400).send({status:false ,msg:"No url Found"})
    }

  } catch (error) {
    return res.status(500).send({ status: false, msg: "server error" });
  }
};




  const redisUrlCode = async function (req, res) {
    try {
      let cachedLongUrl = await GET_ASYNC(`${req.params.urlCode}`);
   
      if (cachedLongUrl) {
        // when valid we perform a redirect
        return res.send({status:false, msg:cachedLongUrl})
      } else {
        // else return a not found 404 status
        const profile = await UrlModel.findOne({ urlCode: req.params.urlCode });
         await SET_ASYNC(`${req.params.urlCode}`,JSON.stringify(profile))
         return res.send({status:true, data:profile})
      }
    } catch (error) {
      return res.status(500).send({ status: false, msg: "server error" });
    }
  };

module.exports.createUrl = createUrl
module.exports.getUrl = getUrl
module.exports.redisUrlCode = redisUrlCode;

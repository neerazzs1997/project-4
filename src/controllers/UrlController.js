const UrlModel = require("../models/UrlModel");
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



// // Rejex of Longurl
const validUrl = (value) => {
  if (!(/(ftp|http|https|FTP|HTTP|HTTPS):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(value.trim()))) {
      return false
  }
      return true
}




// // 
const createUrl = async (req, res) => {
  try {
    let requestbody = req.body

    const { longUrl } = requestbody;

      const baseUrl = "http://localhost:3000";
        

      if(!isvalidRequesbody(requestbody)){
        return res.status(404).send({status:false, msg:"not found data"})
      }
  
  
      if(!isValid(longUrl)) {
          return res.status(400).send({ Status : false, Message: "Url Is Required" })
      }
  
      if (!validUrl(longUrl)) {
          return res.status(400).send({ status: false, Message: "Invalid Long Url" });
      }

      //
      const cahcedUrlData = await GET_ASYNC(`${longUrl}`)
          if (cahcedUrlData) {
              return res.status(200).send({ status: "true", data: cahcedUrlData })
          }
  
      let isUrlExist = await UrlModel.findOne({ longUrl }).select({longUrl : 1, urlCode : 1, shortUrl: 1, _id: 0});
      if (isUrlExist) {
      //
          await SET_ASYNC(`${longUrl}`, JSON.stringify(isUrlExist))
  
          return res.status(201).send({ status: true, Message: "Success", Data: isUrlExist });
      }
  

      // // Generate out urlcode
      const urlCode = shortid.generate()      
  
    
      const shortUrl = baseUrl + "/" + urlCode;          
      shortUrl.toLowerCase();
  
      const urlData = {
          longUrl,
          shortUrl,
          urlCode,
      };
  
      let newUrl = await UrlModel.create(urlData)
  
      let finalData = {
          urlCode : newUrl.urlCode,
          longUrl : newUrl.longUrl,
          shortUrl: newUrl.shortUrl
      }
      return res.status(201).send({ status: true, Message: "success", Data: finalData });
  
  } catch (error) {
      res.status(500).send({ status: false, Err: error.message });
  }
  };





const getUrl = async function (req, res) {
  try {
    
    const url = await UrlModel.findOne({urlCode:req.params.urlCode})
    if(url){
      return res.status(302).redirect(url.longUrl)
    }else{
      return res.status(404).send({status:false ,msg:"No url Found"})
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



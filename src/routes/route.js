const express = require('express');
const router = express.Router();

const urlController=require("../controllers/UrlController")

// // post API
router.post("/url/shorten",urlController.createUrl)

// // get API
router.get("/:urlCode",urlController.getUrl)




module.exports=router;
'use strict';
// Basic Configuration 
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var validUrl = require("valid-url");
var app = express();
var dns = require("dns");
var cors = require('cors');
var shortId = require("shortid");
var app = express();
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
process.env.MONGO_URI="mongodb+srv://amarmrf1:1XtalEWZM4fQReuB@cluster0.ecjxz.mongodb.net/Cluster0?retryWrites=true&w=majority"
const uri = process.env.MONGO_URI

mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true });

var Schema = mongoose.Schema
 
var urlSchema =new Schema({short_url: String, original_url: String});

var UrlModel=mongoose.model('UrlModel', urlSchema)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: true}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

console.log("mongoose ready state:", mongoose.connection.readyState)

console.log(shortId.generate());

//db callback necessary 
var done = (err,data) => {
       if(err) console.error(err);
       //do what you want to do after the operation completes.
       console.log('Done')
}

const url_ = require('url'); 
function dnsCallback(err, address, family) {
  if (err) return console.error(err)
  console.log("Error?",err,"\n",family,address,)
}


const urlValid = url =>{
  const parsedUrl = url_.parse(url);
  const hostNameUrl = dns.lookup(parsedUrl.hostname, dnsCallback);
  return hostNameUrl!=null
}

let urlFind = UrlModel.findOne({original_url:"https://www.freecodecamp.org"}, (err,data)=>{
    if (err) return console.error(err);
    console.log(data)
    done(null, data);
  });

app.post("/api/shorturl/new",(req,res)=>{
  let urlInput = req.body.url
  UrlModel.findOne({original_url:urlInput}, (err,data)=>{
    if (err) return console.error(err);
    if (data){//old: must already be validated in the past
      res.json({original_url:data.original_url, short_url:data.short_url})
      done(null, data);    
    } else if (validUrl.isWebUri(urlInput)){//new: must be validated
      const shortUrl = shortId.generate()
      res.json({original_url:urlInput, short_url:shortUrl})
      var newUrl = new UrlModel(//save
      {original_url:urlInput, short_url:shortUrl});
      newUrl.save(function(err,data){
        if (err) return console.error(err);
        done(null, data);
      })
      done(null, data);
    } else if (!validUrl.isWebUri(urlInput)){//bad
      res.status(401).json({"error":"invalid URL"})
      done(null, data);
    } else {
      res.status(401).json({"error":"wrong format"})
      done(null, data);
    }
  })//close model callback 
  }//close handler
  ) 
  

app.get("/api/shorturl/:shorturl",(req,res)=>{
  if (req.params.shorturl=="new"){
    res.send({"error":"wrong format"})
  }else{
  UrlModel.findOne({short_url:req.params.shorturl}, (err,data)=>{
    if (err) return console.error(err)
    if (data){
      console.log(data);
    res.redirect(data.original_url)
    } else {res.status(404).send({"error":"invalid URL"})}
    done(null, data);
  }) 
  }
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});

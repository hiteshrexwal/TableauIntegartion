const express = require('express');
const router = express.Router();
const apiRouter = require('./api');
const {tableauBaseUrl,myCache,siteName} = require("../bin/settings")



/* GET home page. */
router.get('/', function(req, res, next) {

  if(!myCache.get("token")){
    res.redirect('/login') 
    return
  }

  res.render('index', { 
    title: 'Tabeau Integration',
    tableauBaseUrl,
    siteName,  });
});

router.get('/v2', function(req, res, next) {

  if(!myCache.get("token")){
    res.redirect('/login') 
    return
  }

  res.render('indexV2', { 
    title: 'Tabeau Integration',
    tableauBaseUrl,
    siteName,  });
});


router.get('/v3', function(req, res, next) {

  if(!myCache.get("token")){
    res.redirect('/login') 
    return
  }

  res.render('indexV3', { 
    title: 'Tabeau Integration',
    tableauBaseUrl,
    siteName,  });
});

router.get('/login', function(req, res, next) {
  res.render('login', { isBlueBackground: true });
});

router.use('/api', apiRouter)



module.exports = router;

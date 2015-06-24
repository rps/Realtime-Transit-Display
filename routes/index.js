var express = require('express');
var router = express.Router();
var request = require('superagent');
var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';
var parseString = require('xml2js').parseString;
var poller = require('./../poller.js');

/* GET home page. */
router.get('/', function(req, res1) {
  poller.updateMuni(res1);
});

module.exports = router;

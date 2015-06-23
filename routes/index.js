var express = require('express');
var router = express.Router();
var request = require('superagent');
var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';
var parseString = require('xml2js').parseString;
var poller = require('./../poller.js');


/* GET home page. */
router.get('/', function(req, res1) {

  var agency = '&a=' + 'sf-muni';

  var url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops' + agency;

  //Loop through all routes
  // routes.forEach(function(route) {
  //   url += ('&stops=' + route.name + '|' + route.stop_id);
  // });
  poller.update(res1);


  // $.ajax({
  //   url: url,
  //   dataType: 'xml',
  // console.log(bartAPIKey);
  // request
  //   .get('http://api.bart.gov/api/etd.aspx')
  //   .send({cmd: 'etd', orig: 'MONT', key: bartAPIKey})
  //   .accept('xml')
  //   .end(function(err, xml){
  //     console.log(xml.text);
  //     parseString(xml, function (err, result) {
  //         console.log(result);
  //       res1.send('abc')
  //     });
  //   });
  // res.render('index', { title: 'Realtime Transit Display' });
});

module.exports = router;

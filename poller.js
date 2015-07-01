var request = require('superagent');
var xmldoc = require('xmldoc');

var storage = {};
var queryString = "command=predictionsForMultiStops";
var baseurl = 'http://webservices.nextbus.com/service/publicXMLFeed';

var poller = {};

poller.poll = function(){
  var query = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops&a=sf-muni&stops=5|5689&stops=31|5689&stops=5R|5689";
  request
    .get(query)
    .end(function(err, res){
      return res;
    });
};

var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';

function parseRoutes(predictions){
  var result = {Inbound: {}, Outbound: {}};
  var currentRouteName;
  var direction;
  var minutes;
  predictions.forEach(function(route){
    currentRouteName = route.attr.routeTag;
    if(route.firstChild && route.firstChild.name === 'direction'){
      direction = route.firstChild.attr.title.split(' ')[0];
      if(direction === "Inbound" || direction === "Outbound"){
        if(route.firstChild.children){
          result[direction][currentRouteName] = [];
          for(var i = 0; i<route.firstChild.children.length && result[direction][currentRouteName].length < 2; i++){
            minutes = route.firstChild.children[i].attr.minutes;
            if(minutes > 0 && minutes <= 45){
              result[direction][currentRouteName].push(route.firstChild.children[i].attr.minutes);
            }
          }
          if(result[direction][currentRouteName].length === 0){
            delete result[direction][currentRouteName];
          }
        }
      }
    }
  });
  return result;
}

function refreshRoutes(){
  console.log('refreshing');
  request
    .get(baseurl)
    .query(queryString)
    .end(function(err, result){
      if(result.text){
        var xml = new xmldoc.XmlDocument(result.text);
        storage = parseRoutes(xml.children);
      }
    });

  setTimeout(refreshRoutes, 20000);
}

poller.init = function(){
  var agency = '&a=' + 'sf-muni';
  var OutboundMUNIroutes = [
    { name: 5,     stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: "5R",  stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 21,    stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 31,    stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 38,    stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: "38R", stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 1,     stop_id: 6314, direction: 'west', stop_location: 'Sacramento & Sansome' },
    { name: "N",   stop_id: 6994, direction: 'south', stop_location: 'Montgomery Station' },
    { name: "J",   stop_id: 6994, direction: 'south', stop_location: 'Montgomery Station' },
    { name: "KT",  stop_id: 6994, direction: 'south', stop_location: 'Montgomery Station' },
    { name: "L",   stop_id: 6994, direction: 'south', stop_location: 'Montgomery Station' },
    { name: "M",   stop_id: 6994, direction: 'south', stop_location: 'Montgomery Station' },
    { name: "30X", stop_id: 6326, direction: 'north', stop_location: 'California & Sansome' },
    { name: 41,    stop_id: 6333, direction: 'north', stop_location: 'Sacramento & Sansome' },
    { name: 10,    stop_id: 6327, direction: 'north', stop_location: 'California & Sansome' }
  ];

  var InboundMUNIroutes = [
    { name: "N",   stop_id: 5731, direction: 'east', stop_location: 'Montgomery Station' },
    { name: "J",   stop_id: 5731, direction: 'east', stop_location: 'Montgomery Station' },
    { name: "KT",  stop_id: 5731, direction: 'east', stop_location: 'Montgomery Station' },
    { name: "L",   stop_id: 5731, direction: 'east', stop_location: 'Montgomery Station' },
    { name: "M",   stop_id: 5731, direction: 'east', stop_location: 'Montgomery Station' }
  ];

  queryString+=agency;

  (OutboundMUNIroutes.concat(InboundMUNIroutes)).forEach(function(route) {
    queryString += ('&stops=' + route.name + '|' + route.stop_id);
  });

  refreshRoutes();
};

poller.updateMuni = function(res1, direction){
  var storageAsArrays = generateStorageArray(storage);
  res1.render('index', {title: "test", result: storageAsArrays})
};

function generateStorageArray(stored){
  var ib = stored.Inbound;
  var ob = stored.Outbound;
  var inbound = [];
  var outbound = [];
  var obj;
  for(var key in ib){
    obj = {};
    obj[key] = ib[key]; // stored as objects for jade iteration reasons
    inbound.push(obj);
  }
  for(var key in ob){
    obj = {};
    obj[key] = ob[key];
    outbound.push(obj);
  }
  return {Inbound: inbound.sort(naturalSort), Outbound: outbound.sort(naturalSort)};
}

module.exports = poller;

/*
 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
 */
 function naturalSort (a, b) {
    a = Object.keys(a)[0]; // capture route name from object's only key
    b = Object.keys(b)[0];
    var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
        sre = /(^[ ]*|[ ]*$)/g,
        dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
        hre = /^0x[0-9a-f]+$/i,
        ore = /^0/,
        i = function(s) { return naturalSort.insensitive && (''+s).toLowerCase() || ''+s },
        // convert all to strings strip whitespace
        x = i(a).replace(sre, '') || '',
        y = i(b).replace(sre, '') || '',
        // chunk/tokenize
        xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
        // numeric, hex or date detection
        xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
        yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null,
        oFxNcL, oFyNcL;
    // first try and sort Hex codes or Dates
    if (yD)
        if ( xD < yD ) return -1;
        else if ( xD > yD ) return 1;
    // natural sorting through split numeric strings and default strings
    for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
        // find floats not starting with '0', string or 0 if not defined (Clint Priest)
        oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
        oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
        // handle numeric vs string comparison - number < string - (Kyle Adams)
        if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
        // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
        else if (typeof oFxNcL !== typeof oFyNcL) {
            oFxNcL += '';
            oFyNcL += '';
        }
        if (oFxNcL < oFyNcL) return -1;
        if (oFxNcL > oFyNcL) return 1;
    }
    return 0;
}

// returns {time, date}
function updateClock() {
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var now = new Date();

  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var day = days[ now.getDay() ];
  var date = now.getDate();
  var month = months[ now.getMonth() ];

  // Pad the minutes and seconds with leading zeros, if required
  minutes = ( minutes < 10 ? '0' : '' ) + minutes;
  seconds = ( seconds < 10 ? '0' : '' ) + seconds;

  // Choose either 'AM' or 'PM' as appropriate
  var timeOfDay = ( hours < 12 ) ? 'AM' : 'PM';

  // Convert the hours component to 12-hour format if needed
  hours = ( hours > 12 ) ? hours - 12 : hours;

  // Convert an hours component of '0' to '12'
  hours = ( hours == 0 ) ? 12 : hours;

  // Compose the string for display
  var timeString = hours + ':' + minutes + ':' + seconds + ' ' + timeOfDay;
  var dateString = day + ', ' + month + ' ' + date;

  // Update the time display
  return {time: timeString, date: dateString};
  // $('#clock').html(timeString);
  // $('#date').html(dateString);
}

// jQuery.fn.orderBy = function(keySelector) {
//   return this.sort(function(a,b) {
//     a = keySelector.apply(a);
//     b = keySelector.apply(b);
//     if (a > b)
//       return 1;
//     if (a < b)
//       return -1;
//     return 0;
//   });
// };

// function updateWeather() {
//   $.getJSON('/api/weather', function(data){
//     //Current conditions
//     var temp = Math.round(data[0].current_observation.temp_f);
//     $('#weather .temp')
//       .css('color', colorTemp(temp))
//       .html(temp + '&deg;');

//     //Forecast
//     var forecast = data[1].forecast.simpleforecast.forecastday[0];
//     $('#weather .forecast').html(
//       '<img src="http://icons-ak.wxug.com/i/c/a/' + forecast.icon + '.gif" class="weathericon">' +
//       forecast.conditions +
//       '<br>High: <span style="color:' + colorTemp(forecast.high.fahrenheit) + ';">' + forecast.high.fahrenheit + '&deg;F</span>' +
//       '<br>Low: <span style="color:' + colorTemp(forecast.low.fahrenheit) + ';">' + forecast.low.fahrenheit + '&deg;F' + '</span>' +
//       '<br>Precip: ' + forecast.pop + '%'
//     );
//   });

  function colorTemp(temp) {
    var color = Math.min(Math.round( 255 - Math.abs(temp - 65) * (255 / 30) ), 255);
    if(temp > 65) {
      //its hot
      return 'rgb(255,' + color + ',' + color + ')';
    } else {
      //its cold
      return 'rgb(' + color + ',' + color + ',255)';
    }
  }

// function updateBART(){
//   updateBARTDepartures();
//   updateBARTAdvisories();
// }

// function updateBARTDepartures(){
//   var bart = [];

//   request
//     .get('http://api.bart.gov/api/etd.aspx')
//     .send({cmd: 'etd', orig: 'MONT', key: bartA})
//   $.ajax({
//     url: 'http://api.bart.gov/api/etd.aspx',
//     data: {
//       cmd: 'etd',
//       orig: 'MONT',
//       key: bartAPIKey
//     },
//     dataType: 'xml',
//     success:function(result){
//       $('#bart-north, #bart-south').empty();

//       $(result).find('etd').each(function(i, data){
//         //Process directions
//         departure = addDirection(data);
//         if(departure){
//           bart.push(departure);
//         }
//       });

//       //Sort departures
//       bart.sort(bartSortHandler);

//       bart.forEach(function(departure){
//         $(departure.div).appendTo( (departure.direction == 'North') ? $('#bart-north') : $('#bart-south'));
//       });
//     }
//   });

//   function addDirection(data){
//     var departure = {
//       destination: $(data).find('destination').text(),
//       times: []
//     };

//     if(departure.destination == 'Dublin/Pleasanton') {
//       departure.destination = 'Dublin/ Pleasanton';
//     }

//     $(data).find('estimate').each(function(j, data){
//       //Only add times where minutes are less than 100
//       if($(data).find('minutes').text() < 100){
//         //Convert "Arrived" to "Arr"
//         var minutes = ($(data).find('minutes').text() == 'Arrived') ? 0 : $(data).find('minutes').text();
//         departure.hexcolor = $(data).find('hexcolor').text();
//         departure.color = $(data).find('color').text();
//         departure.times.push(minutes);
//         departure.direction = $(data).find('direction').text();
//       }
//     });

//     departure.div = $('<div>')
//       .addClass('bart')
//       .append($('<div>')
//         .addClass('destination')
//         .css('background', departure.hexcolor)
//         .css('color', (departure.color == 'YELLOW') ? '#333' : '#FFF')
//         .html(departure.destination))
//       .append($('<div>')
//         .addClass('nextbus'))
//       .append($('<div>')
//         .addClass('laterbuses')
//         .append($('<div>')
//           .addClass('time'))
//         .append($('<div>')
//           .addClass('time')));

//     departure.times.forEach(function(time, idx){
//       if(idx == 0) {
//         $('.nextbus', departure.div).html(time);
//         $('.laterbuses .time', departure.div).empty();
//       } else {
//         $($('.laterbuses .time', departure.div).get((idx - 1))).html(time);
//       }
//     })

//     //Check if first time is less than 40 minutes away. If not, discard entire destination
//     return (departure.times[0] < 40) ? departure : false;
//   }

//   function bartSortHandler(a, b){
//     return (a.times[0] - b.times[0]);
//   }
// }

// function updateBARTAdvisories(){
//   $.ajax({
//     url: 'http://api.bart.gov/api/bsa.aspx',
//     data: {
//       cmd: 'bsa',
//       orig: 'MONT',
//       key: bartAPIKey
//     },
//     dataType: 'xml',
//     success:function(result){
//       $('#bart .advisories').empty();
//       $(result).find('bsa').each(function(i, data){
//         //Process advisories
//         var description = $(data).find('description').text();
//         if(description != 'No delays reported.') {
//           $('<div>')
//             .addClass('advisory')
//             .text(description)
//             .appendTo('#bart .advisories');
//         }
//       });
//     }
//   });
// };
var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';

 var OutboundMUNIroutes = [
    { name: 5,     stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: "5L",  stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 21,    stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 31,    stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: 38,    stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
    { name: "38L", stop_id: 5689, direction: 'west', stop_location: 'Market & Sansome' },
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

jQuery.fn.orderBy = function(keySelector) {
  return this.sort(function(a,b) {
    a = keySelector.apply(a);
    b = keySelector.apply(b);
    if (a > b)
      return 1;
    if (a < b)
      return -1;
    return 0;
  });
};

function updateWeather() {
  $.getJSON('/api/weather', function(data){
    //Current conditions
    var temp = Math.round(data[0].current_observation.temp_f);
    $('#weather .temp')
      .css('color', colorTemp(temp))
      .html(temp + '&deg;');

    //Forecast
    var forecast = data[1].forecast.simpleforecast.forecastday[0];
    $('#weather .forecast').html(
      '<img src="http://icons-ak.wxug.com/i/c/a/' + forecast.icon + '.gif" class="weathericon">' +
      forecast.conditions +
      '<br>High: <span style="color:' + colorTemp(forecast.high.fahrenheit) + ';">' + forecast.high.fahrenheit + '&deg;F</span>' +
      '<br>Low: <span style="color:' + colorTemp(forecast.low.fahrenheit) + ';">' + forecast.low.fahrenheit + '&deg;F' + '</span>' +
      '<br>Precip: ' + forecast.pop + '%'
    );
  });

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
}

function updateBART(){
  updateBARTDepartures();
  updateBARTAdvisories();
}

function updateBARTDepartures(){
  var bart = [];

  $.ajax({
    url: 'http://api.bart.gov/api/etd.aspx',
    data: {
      cmd: 'etd',
      orig: 'MONT',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('#bart-north, #bart-south').empty();

      $(result).find('etd').each(function(i, data){
        //Process directions
        departure = addDirection(data);
        if(departure){
          bart.push(departure);
        }
      });

      //Sort departures
      bart.sort(bartSortHandler);

      bart.forEach(function(departure){
        $(departure.div).appendTo( (departure.direction == 'North') ? $('#bart-north') : $('#bart-south'));
      });
    }
  });

  function addDirection(data){
    var departure = {
      destination: $(data).find('destination').text(),
      times: []
    };

    if(departure.destination == 'Dublin/Pleasanton') {
      departure.destination = 'Dublin/ Pleasanton';
    }

    $(data).find('estimate').each(function(j, data){
      //Only add times where minutes are less than 100
      if($(data).find('minutes').text() < 100){
        //Convert "Arrived" to "Arr"
        var minutes = ($(data).find('minutes').text() == 'Arrived') ? 0 : $(data).find('minutes').text();
        departure.hexcolor = $(data).find('hexcolor').text();
        departure.color = $(data).find('color').text();
        departure.times.push(minutes);
        departure.direction = $(data).find('direction').text();
      }
    });

    departure.div = $('<div>')
      .addClass('bart')
      .append($('<div>')
        .addClass('destination')
        .css('background', departure.hexcolor)
        .css('color', (departure.color == 'YELLOW') ? '#333' : '#FFF')
        .html(departure.destination))
      .append($('<div>')
        .addClass('nextbus'))
      .append($('<div>')
        .addClass('laterbuses')
        .append($('<div>')
          .addClass('time'))
        .append($('<div>')
          .addClass('time')));

    departure.times.forEach(function(time, idx){
      if(idx == 0) {
        $('.nextbus', departure.div).html(time);
        $('.laterbuses .time', departure.div).empty();
      } else {
        $($('.laterbuses .time', departure.div).get((idx - 1))).html(time);
      }
    })

    //Check if first time is less than 40 minutes away. If not, discard entire destination
    return (departure.times[0] < 40) ? departure : false;
  }

  function bartSortHandler(a, b){
    return (a.times[0] - b.times[0]);
  }
}

function updateBARTAdvisories(){
  $.ajax({
    url: 'http://api.bart.gov/api/bsa.aspx',
    data: {
      cmd: 'bsa',
      orig: 'MONT',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('#bart .advisories').empty();
      $(result).find('bsa').each(function(i, data){
        //Process advisories
        var description = $(data).find('description').text();
        if(description != 'No delays reported.') {
          $('<div>')
            .addClass('advisory')
            .text(description)
            .appendTo('#bart .advisories');
        }
      });
    }
  });
};

function updateMUNI(direction){
  var routes = {
    inbound: InboundMUNIroutes,
    outbound: OutboundMUNIroutes
  }[direction] || OutboundMUNIroutes.concat(InboundMUNIroutes);

  var agency = '&a=' + 'sf-muni';

  var url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops' + agency;

  //Loop through all routes
  routes.forEach(function(route) {
    url += ('&stops=' + route.name + '|' + route.stop_id);
  });

  $.ajax({
    url: url,
    dataType: 'xml',
    success:function(result){
      var predictions = $(result).find('predictions');

      predictions.each(function(i, p){
        var prediction = $(p);
        if(prediction.attr('dirTitleBecauseNoPredictions')){
          return true;
        }

        var routeTag = prediction.attr('routeTag'),
            stopTag = prediction.attr('stopTag'),
            directionTitle = prediction.find('direction').attr('title').split(" "),
            direction = directionTitle[0].toLowerCase(), // may be valuable to manually replace with cardinal dir
            destination = {
              inbound: InboundMUNIroutes,
              outbound: OutboundMUNIroutes
            }[direction].filter(function(el){ return el.name == routeTag })[0].stop_location;

        var divName = 'muni_' + routeTag.replace(/\s/g, '') + '_' + direction,
            div = $('#'+ divName),
            routeName = routeTag.replace(/\s\D+/g, "<span>$&</span>").replace(/(\d)(L)/g, "$1<span>$2</span>"),
            times = prediction.find('prediction');

        if(!div.length) {
          div = $('<div>')
            .addClass('muni')
            .attr('id', divName)
            .appendTo('#muni-' + direction);
        }
        div
          .empty()
          .append($('<div>')
            .addClass('busnumber')
            .html(routeName))
          .append($('<div>').addClass('destinationContainer')
            .append($('<div>')
              .addClass('rotate')
              .html(destination)))
          .append($('<div>')
            .addClass('nextbus time'))
          .append($('<div>')
            .addClass('laterbuses')
            .append($('<div>')
              .addClass('time'))
            .append($('<div>')
              .addClass('time')));

        var results = 0,
            idx = 0,
            len = times.length;

        while (results < 3 && idx < len){
          //Limit to 3 results, only show times less than 100, don't show results that are 0
          var time = times[idx],
              min = $(time).attr('minutes');
          if(min < 100 && min > 0){
            $('.time', div).eq(results).html(min);
            results++;
          }
          idx++;
        }

        //hide if no predictions
        div.toggle((times.length > 0));
      });

      $('.muniContainer').each(function(idx, muniContainer){
        $('.muni', muniContainer).sort(natcmp).appendTo(muniContainer);
      });

      // Verify data does not run off screen
      resizeWindow();
    }
  });
}

// https://stackoverflow.com/questions/15478954/sort-array-elements-string-with-numbers-natural-sort
function strcmp(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
}

function natcmp(a, b) {
    a = $('.busnumber', a).text()
    b = $('.busnumber', b).text()
    var x = [], y = [];

    a.replace(/(\d+)|(\D+)/g, function($0, $1, $2) { x.push([$1 || 0, $2]) })
    b.replace(/(\d+)|(\D+)/g, function($0, $1, $2) { y.push([$1 || 0, $2]) })

    while(x.length && y.length) {
        var xx = x.shift();
        var yy = y.shift();
        var nn = (xx[0] - yy[0]) || strcmp(xx[1], yy[1]);
        if(nn) return nn;
    }
    // 5L follows 5
    if(x.length) return +1;
    if(y.length) return -1;

    return 0;
}

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
  $('#clock').html(timeString);
  $('#date').html(dateString);
}


function resizeWindow() {
  var visibleHeight = $(window).height() - 50,
      biggestColHeight = Math.max.apply(null, $('.grid-three').map(function(){return $(this).height()})),
      currentHeight = biggestColHeight + $('header').height();

  if(currentHeight > visibleHeight){
    //Calculate percent to scale
    var percent = Math.ceil((1 - ((currentHeight - visibleHeight) / currentHeight)) * 100);
    // Adjust stuff
  }
}

function reloadPage(){
  window.location.reload(true);
}

$(document).ready(function(){

  //detect color depth
  if(screen.colorDepth < 24) {
    $('body').addClass('noGradients');
  }

  //Resize Window
  resizeWindow();
  $(window).bind("resize", resizeWindow);

  //Update Clock
  updateClock();

  // Get BART
  updateBART();

  //Get MUNI
  updateMUNI()

  //Get weather every 15 minutes
  // var mins = new Date().getMinutes();
  // if(mins % 15 === 0){ updateWeather(); }
});

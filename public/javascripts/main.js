var bartAPIKey = 'MW9S-E7SL-26DU-VV8V'; // need to change

var muniColors = {
  "1":"cc6600",
  "2":"000000",
  "3":"339999",
  "5":"666699",
  "6":"996699",
  "9":"889944",
  "10":"b07d00",
  "12":"b07d00",
  "14":"339999",
  "17":"003399",
  "18":"996699",
  "19":"000000",
  "21":"660000",
  "22":"ff6633",
  "23":"b07d00",
  "24":"996699",
  "27":"660099",
  "28":"000000",
  "29":"ff6633",
  "30":"990099",
  "31":"339999",
  "33":"660000",
  "35":"ff6633",
  "36":"003399",
  "37":"000000",
  "38":"ff6633",
  "39":"ff6633",
  "41":"b07d00",
  "43":"006633",
  "44":"ff6633",
  "45":"006633",
  "47":"667744",
  "48":"cc6600",
  "49":"b07d00",
  "52":"889944",
  "54":"cc0033",
  "55":"cc0033",
  "56":"990099",
  "59":"cc3399",
  "60":"4444a4",
  "61":"9ac520",
  "66":"666699",
  "67":"555555",
  "71":"667744",
  "88":"555555",
  "90":"660000",
  "91":"667744",
  "108":"555555",
  "F":"555555",
  "J":"cc6600",
  "KT":"cc0033",
  "L":"660099",
  "M":"006633",
  "N":"003399",
  "NX":"006633",
  "1AX":"990000",
  "1BX":"cc3333",
  "5L":"666699",
  "8X":"996699",
  "8AX":"996699",
  "8BX":"996699",
  "9L":"889944",
  "14L":"009900",
  "14X":"cc0033",
  "16X":"cc0033",
  "28L":"009900",
  "30X":"cc0033",
  "31AX":"990000",
  "31BX":"cc3333",
  "38AX":"990000",
  "38BX":"cc3333",
  "38L":"009900",
  "71L":"009900",
  "76X":"009900",
  "81X":"cc0033",
  "82X":"cc0033",
  "83X":"cc0033",
  "K_OWL":"198080",
  "L_OWL":"330066",
  "M_OWL":"004d19",
  "N_OWL":"001980",
  "T_OWL":"660019"
};

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
      orig: '16TH',
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
      orig: '16TH',
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


function updateMUNI(){
 var MUNIroutes = [
    { route: 5,     stop: 5689, direction: 'west' },
    { route: "5L",  stop: 5689, direction: 'west' },
    { route: 21,    stop: 5689, direction: 'west' },
    { route: 31,    stop: 5689, direction: 'west' },
    { route: 38,    stop: 5689, direction: 'west' },
    { route: "38L", stop: 5689, direction: 'west' },
    { route: 1,     stop: 6314, direction: 'west' },
    { route: "N",   stop: 6994, direction: 'south' },
    { route: "J",   stop: 6994, direction: 'south' },
    { route: "KT",  stop: 6994, direction: 'south' },
    { route: "L",   stop: 6994, direction: 'south' },
    { route: "M",   stop: 6994, direction: 'south' },
    { route: "30X", stop: 6326, direction: 'north' },
    { route: 41,    stop: 6333, direction: 'north' },
    { route: 10,    stop: 6327, direction: 'north' }
  ];

  var agency = '&a=' + 'sf-muni';

  var url = 'http://webservices.nextbus.com/service/publicXMLFeed?command=predictionsForMultiStops' + agency;

  //Loop through all routes
  MUNIroutes.forEach(function(route) {
    url += ('&stops=' + route.route + '|' + route.stop);
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
            destination = directionTitle.splice(2).join(" ");

        var divName = 'muni' + routeTag.replace(/\s/g, '') + '_' + stopTag,
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
        $('.muni', muniContainer).orderBy(function() {return $('.busnumber', this).text();}).appendTo(muniContainer);
      });

      // Verify data does not run off screen
      resizeWindow();
    }
  });
}

function updateUber() {
  $.getJSON('/api/uber', function(data) {
    $('.uberContainer .col1, .uberContainer .col2').empty();

    if(data && data[0] && data[0].times) {
      data[0].times.forEach(function(service, idx) {
        var div = $('<div>')
          .addClass('uber')
          .attr('id', service.product_id)
          .append($('<div>')
            .addClass('serviceName')
            .text(service.display_name))
          .append($('<div>')
            .addClass('time')
            .text(Math.round(service.estimate / 60)));
        if(idx < 2) {
          div.appendTo('.uberContainer .col1');
        } else {
          div.appendTo('.uberContainer .col2');
        }
      });
    }
    if(data && data[1] && data[1].prices) {
      data[1].prices.forEach(function(price, idx) {
        if(price.surge_multiplier > 1) {
          var html = price.display_name + ' <span>(' + price.surge_multiplier + 'x)</span>';
          $('#' + price.product_id)
            .addClass('surge')
            .find('.serviceName')
              .html(html);
        }
      });
    }
  });
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
    $('#main').css('font-size', percent + '%');
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
  setInterval(updateClock, 1000);

  //Get BART
  // updateBART();
  // setInterval(updateBART, 15000);

  //Get MUNI
  updateMUNI()
  // setInterval(updateMUNI, 15000);

  //Get Uber
  // updateUber();
  // setInterval(updateUber, 60000);

  //Get weather every hour
  // updateWeather();
  // setInterval(updateWeather, 3600000);

  //reload browser every 6 hours
  setInterval(reloadPage, 21600000);

});

'use strict';

require('dotenv').config(); //import dotenv library
const express = require('express'); //import express library
const cors = require('cors'); //import cors library
const app = express(); //invoke express library

const PORT = process.env.PORT || 3000; //what port

function Location(data, searchQuery) {
  this.search_query = searchQuery;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(obj) {
  this.time = new Date(obj.time * 1000).toDateString();
  this.forecast = obj.summary;
}
// function handleLocation(request, response) {
//   let location;
//   let locations = require('./data/location.json');
//   let filterValue = request.query.city;

//   for (let i in locations) {
//     console.log(locations[i].display_name.toLowerCase().includes
//     (filterValue.toLowerCase()));
//     if (locations[i].display_name.toLowerCase().includes(filterValue.toLowerCase())) {
//       console.log(filterValue);
//       console.log(locations[i].display_name);
//       location = new Location(locations[i], filterValue);
//       console.log(location, 'hdkghs');
//       response.status(200).send(location);
//     }
//     // console.log(typeof location !== 'undefined');
//     // }if(typeof location !== 'undefined') {
//     //   console.log('bingbong');
//     //   // response.status(200).send(location);
//     // }
//     else {
//       throw new Error('BROKEN');
//     }
//   }
// }


// function handleWeather(request, response) {
//   const weatherData = require('./data/weather.json').data;

//   const results = [];
//   weatherData.forEach(item => {
//     results.push(new Forecast(item.datetime, item.weather.description));
//   });
//   response.send(results);
// }

// function handleError(error, request, response, next){
//   response.status(500).send({
//     status: 500,
//     responseText: 'Sorry, somethings wrong'
//   });
// }

function handleLocation(request, response){
  try{
    let cityQuery = request.query.city;
    let locationData = require('./data/location.json');
    let location = new Location(locationData[0], cityQuery);
    response.send(location);
  }catch(err){
    response.status(500).send(err);
    console.error(err);
  }
}

function handleWeather (request, response){

  let weatherData = require('./data/weather.json');
  let weatherArr = weatherData.daily.data;

  const finalWeatherArr = weatherArr.map(day => {
    return new Weather(day);
  });
  response.send(finalWeatherArr);
}

app.get('/location', handleLocation);

app.get('/weather', handleWeather);

app.use(cors());
// app.use(handleError);

//start sever / listen for requests
app.listen(PORT, () => {
  console.log('Server is running on PORT: ' + PORT);

});

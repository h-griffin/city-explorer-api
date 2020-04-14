'use strict';

require('dotenv').config(); //import dotenv library
const express = require('express'); //import express library
const cors = require('cors'); //import cors library
const app = express(); //invoke express library

const PORT = process.env.PORT || 3000; //what port

function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function handleLocation(request, response){
  const cityQuery = request.query.city;
  const locationData = require('./data/location.json');

  for (i in locationData) {
    if (locationData[i].display_name.search(cityQuery)){
      const location = new Location(city.query, locationData[i]);
      response.send('Successful Search');
      return;
    }
  }

  console.log(cityQuery, locationData);
  handleError ('soemthins wong', request, response);
  // const latitiude = jsonData[0].lat;
  // const longitude = jsonData[0].lon;
  response.send('Whoops');
}

function Forecast(time, forecast) {
  this.forecast = forecast;
  this.time = new Date(date).toDateString();
}

function handleWeather(request, response) {
  const weatherData = require('./data/weather.json').data;

  const results = [];
  weatherData.forEach(item => {
    results.push(new Forecast(item.datetime, item.weather.description));
  });
  response.send('done weather');
}

function handleError(error, request, response){
  response.status(500).send({
    status: 500,
    responseText: 'Sorry, somethings wrong'
  });
}

// app.get('/location', ( (handleLocation) => {
//   let geo = require('./data/geo.json'); //get info from geo.json

//   let location = new Location(geo[0], 'city'); //new location / get first / city from request
//   if (location) {
//     response.status(200).send(location);
//   }else{
//     response.status(404).send('Cant find your city');
//   }
// });

app.use(cors());
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
// app.use(() => {
// handleError('something bad happened');
// });

//start sever / listen for requests
app.listen(PORT, () => {
  console.log('Server is running on PORT: ' + PORT);

});

'use strict';

require('dotenv').config(); //import dotenv library
const express = require('express'); //import express library
const app = express(); //invoke express library
const superagent = require('superagent'); //superagent library
const cors = require('cors'); //import cors library
const pg = require('pg');

const PORT = process.env.PORT || 3000; //what port
app.use(cors());

const dbClient = new pg.Client(process.env.DATABASE_URL);
dbClient.connect();

dbClient.on('error', error => console.log(error));

function Location(searchQuery, data) {
  this.search_query = searchQuery;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(obj, forecast) {
  this.time = new Date(obj).toDateString();
  this.forecast = forecast;
}

function handleError(error, request, response){
  response.status(500).send({
    status: 500,
    responseText: 'Sorry, somethings wrong'
  });
}

function handleLocation(request, response){
  console.log('test');
  let cityQuery = request.query.city;
  const key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityQuery}&format=json&limit=1`;
  console.log(url);
  superagent.get(url)
    .then(locationResponse => {
      const data = locationResponse.body;
      for (var i in data){
        if (data[i].display_name.search(cityQuery)){
          const location = new Location (cityQuery, data[i]);
          console.log(location);
          response.send(location);
        }
      }
    })
    .catch(error => {
      handleError(error, request, response);
    });
}

console.log('hello?');

function handleWeather (request, response){
  const { latitude, longitude } = request.query;
  const key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}`;

  superagent.get(url)
    .then(weatherResponse => {
      const data = weatherResponse.body.data;
      const results = [];
      data.forEach(item => {
        results.push(new Weather(item.datetime, item.weather.description));
      });
      response.send(results);
    }).catch(error => {
      handleError(error, request, response);
    });
}

function Trails(obj){
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionDetails;
}

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.use('*', (request, response) => response.send('sorry that rout does not exist'));

//start sever / listen for requests
app.listen(PORT, () => {
  console.log('Server is running on PORT: ' + PORT);

});

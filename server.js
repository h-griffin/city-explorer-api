'use strict';

//import / invoke libraries
require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const PORT = process.env.PORT || 3000;
const dbClient = new pg.Client(process.env.DATABASE_URL);
app.use(cors());

//turn on database
dbClient.connect((err) => {
  if (err){
    console.log(err);
  }else{
    console.log('database connected');
  }
});

function Location(searchQuery, data) {
  this.search_query = searchQuery;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(obj) {
  this.time = new Date(obj.datetime).toDateString();
  this.forecast = obj.weather.description;
}

function Trail(obj){
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionDetails;
  this.condition_date = new Date (splitDate(obj.conditionDate)[0]).toDateString();
  this.condition_time = splitDate(obj.conditionDate)[1];
}

const splitDate = (str) => str.split(' ');

function handleError(error, request, response){
  console.log(error);
  response.status(400).send(error);
}

function handleLocation(request, response){
  let searchQuery = request.query.city;
  const key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${searchQuery}&format=json&limit=1`;
  const searchSQL = `SELECT * FROM locations WHERE search_query=$1`;
  const searchValues = [searchQuery];

  dbClient.query(searchSQL, searchValues)
    .then(record => {
      if(record.rows.length === 0){
        superagent.get(url)
          .then(locationResponse => {
            const data = locationResponse.body[0];
            const location = new Location(searchQuery, data);
            response.send(location);

            let insertSQL = `INSERT INTO locations(search_query, formatted_query, latitude, longitude) VALUEs ($1, $2, $3, $4)`;
            let insertValues = [searchQuery, data.display_name, data.lat, data.lon];

            dbClient.query(insertSQL, insertValues)
              .then(record => {
                console.log('location stored in database');
              })
              .catch(error => {
                handleError('location error : DB insert no good');
              });
          })
          .catch(error =>{
            handleError('location error : superagent bad', request, response);
          });
      }else {
        console.log('location received from database');
        response.send(record.rows[0]);
      }
    })
    .catch(error => {
      handleError('location error : match to DB', request, response);
    });
}

function handleWeather (request, response){
  const { latitude, longitude } = request.query;
  const key = process.env.WEATHER_API_KEY;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${key}&days=7`;

  superagent.get(url)
    .then(weatherResponse => {
      const data = weatherResponse.body.data;
      response.send(data.map(item => {
        return new Weather(item);
      }));
    }).catch(error => {
      handleError('weather error : superagent bad', request, response);
    });
}

function handleTrails(request, response){
  const { latitude, longitude } = request.query;
  const key = process.env.TRAIL_API_KEY;
  const url =`https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(trailsResponse => {
      console.log(trailsResponse.body);
      const data = trailsResponse.body.trails;
      response.send(data.map(item => {
        return new Trail(item);
      }));
    })
    .catch(error => {
      handleError('trail error : superagent bad', request, response);
    });
}

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});

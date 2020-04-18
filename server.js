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

app.get('/location', handleLocation);

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});

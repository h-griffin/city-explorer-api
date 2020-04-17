'use strict';

//import / invoke libraries
require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');

const PORT = process.env.PORT || 3000; //what port
app.use(cors());

const dbClient = new pg.Client(process.env.DATABASE_URL);

//move to bottom
//figure out what one of these i need
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

// function Trails(obj){
//   this.name = obj.name;
//   this.location = obj.location;
//   this.length = obj.length;
//   this.stars = obj.stars;
//   this.star_votes = obj.starVotes;
//   this.summary = obj.summary;
//   this.trail_url = obj.url;
//   this.conditions = obj.conditionDetails;
//   this.condition_date = trail.conditionDate;
//   this.condition_time = trail.conditionTime;
// }

function handleError(error, request, response){
  response.status(500).send({
    status: 500,
    responseText: 'Sorry, somethings wrong'
  });
}

// function handleLocation(request, response){
//   console.log('test');

//   let cityQuery = request.query.city;
//   const key = process.env.GEOCODE_API_KEY;
//   const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityQuery}&format=json&limit=1`;

//   let searchSQL = `SELECT * FROM locations WHERE search_query=$1 RETURNS *;`;
//   let searchValues = [cityQuery];
//   let insertSQL = `INSERT INTO locations(search_query, display_name, latitude, longitude) VALUEs ($1, $2, $3, $4);`;

//   dbClient.query(searchSQL, searchValues)
//     .then(sqlResults => {
//       if(sqlResults.rows[0]){
//         response.send(sqlResults.rows[0]);
//       }else{
//         //do superagent stuff
//         superagent.get(url)
//           .then(locationResponse => {
//             let insertValues = [cityQuery, locationResponse.body[0].display_name, locationResponse.body[0].lat, locationResponse.body[0].lon];
//             dbClient.query(insertSQL, insertValues)
//               .then( () => {
//                 console.log('test2');
//                 // declaredLocationResponse(locationResponse, response, city);
//                 const data = locationResponse.body;
//                 for (var i in data){
//                   if (data[i].display_name.search(cityQuery)){
//                     const location = new Location (cityQuery, data[i]);
//                     console.log(location);
//                     response.send(location);
//                   }
//                 }
//               });
//           })
//           .catch(error => {
//             handleError(error, request, response);
//           });
//       }
//     })
//     .catch(sqlError => {
//       handleError(sqlError, request, response);
//     });
// }

function handleLocation(request, response){
  let searchQuery = request.query.city;
  const key = process.env.GEOCODE_API_KEY;
  // const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${searchQuery}&format=json&limit=1`;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${searchQuery}`;

  // let searchSQL = `SELECT * FROM locations WHERE search_query=$1 RETURNS *;`;
  // let searchValues = [searchQuery];
  // let insertSQL = `INSERT INTO locations(search_query, display_name, latitude, longitude) VALUEs ($1, $2, $3, $4);`;

  console.log(request);
  superagent.get(url)
    .then(result => {
      const location = new Location(searchQuery, result);
      response.send(location);
    })

  // superagent.get(url)
  //   .then(data => {
  //     console.log(url);
  //     let newLocation = new Location(searchQuery, data);
  //     console.log(newLocation, 'location?');
  //     response.send(newLocation);
  //   })

  // dbClient.query(searchSQL, searchValues)
  //   .then(sqlResults => sqlResults.rows[0])
  //   .then(location => {
  //     if (location){
  //       response.send(location);
  //       return null;
  //     }else{
  //       return superagent.get(url);
  //     }
  //   })
  //   .then(locationResponse => {
  //     if(locationResponse){
  //       let insertValues = [cityQuery, locationResponse.body[0].display_name, locationResponse.body[0].lat, locationResponse.body[0].lon];
  //       dbClient.query(insertSQL, insertValues);
  //       return locationResponse;
  //     }else{
  //       return null;
  //     }
  //   })
  //   .then(locationResponse => {
  //     if(locationResponse) {
  //       const data = locationResponse.body;
  //       for (var i in data){
  //         const location = new Location (searchQuery, data[i]);
  //         response.send(location);
  //       }
  //     }})
    .catch(error => {
      handleError(error, request, response);
    });
}

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

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.use('*', (request, response) => response.send('sorry that rout does not exist'));

//turn on database and server
dbClient.connect((err) => {
  if (err){
    console.log(err);
  }else{
    app.listen(PORT, () => {
      console.log('Server is running on PORT: ' + PORT);
    });
  }
});

//start sever / listen for requests
// app.listen(PORT, () => {
//   console.log('Server is running on PORT: ' + PORT);

// });

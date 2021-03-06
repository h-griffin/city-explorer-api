/* eslint-disable indent */
'use strict';


//import / invoke libraries
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const { move } = require('superagent');
const PORT = process.env.PORT || 3000;

// initiate express and psql database
const app = express();
const dbClient = new pg.Client(process.env.DATABASE_URL);
app.use(cors());

// connect database
dbClient.connect((err) => {
    if (err) {
        console.log('failed to connect database', err);
    } else {
        console.log('database connected');
    }
});

// create objects
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

// const splitDate = (str) => str.split(' ');

// function Trail(obj){
//   this.name = obj.name;
//   this.location = obj.location;
//   this.length = obj.length;
//   this.stars = obj.stars;
//   this.star_votes = obj.starVotes;
//   this.summary = obj.summary;
//   this.trail_url = obj.url;
//   this.conditions = obj.conditionDetails;
//   this.condition_date = new Date (splitDate(obj.conditionDate)[0]).toDateString();
//   this.condition_time = splitDate(obj.conditionDate)[1];
// }

function Movie(movie) {
    this.title = movie.original_title;
    this.overview = movie.overview.slice(0, 750);
    this.average_votes = movie.votes_average;
    this.total_votes = movie.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
    this.popularity = movie.popularity;
    this.released_on = movie.release_date;
}

function Yelp(yelp) {
    this.name = yelp.name;
    this.image_url = yelp.image_url;
    this.price = yelp.price;
    this.rating = yelp.rating;
    this.url = yelp.url;
}

function handleError(error, request, response) {
    console.log(error);
    response.status(400).send(error);
}

function handleLocation(request, response) {
    let searchQuery = request.query.city;
    const key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${searchQuery}&format=json&limit=1`;
    const searchSQL = `SELECT * FROM locations WHERE search_query=$1`;
    const searchValues = [searchQuery];

    dbClient.query(searchSQL, searchValues)
        .then(record => {
            if (record.rows.length === 0) {
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
                    .catch(error => {
                        handleError('location error : superagent bad', request, response);
                    });
            } else {
                console.log('location received from database');
                response.send(record.rows[0]);
            }
        })
        .catch(error => {
            handleError('location error : match to DB', request, response);
        });
}

function handleWeather(request, response) {
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

// function handleTrails(request, response){
//   const { latitude, longitude } = request.query;
//   const key = process.env.TRAIL_API_KEY;
//   const url =`https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${key}`;

//   superagent.get(url)
//     .then(trailsResponse => {
//       const data = trailsResponse.body.trails;
//       response.send(data.map(item => {
//         return new Trail(item);
//       }));
//     })
//     .catch(error => {
//       handleError('trail error : superagent bad', request, response);
//     });
// }


function handleMovie(request, response, next) {
    const city = request.query.search_query;
    const key = process.env.MOVIE_API_KEY;
    const url = `https://api.themoviedb.org/3/movie/550?api_key=${key}&query=${city}`;

    superagent.get(url)
        .then(movieResults => {
            const movie = movieResults.body.results;
            response.send(movie.map(result => {
                return new Movie(result);
            }));
        })
        .catch(error => {
            handleError('movie error : super agent bad', request, response, next);
        });
}

function handleYelp(request, response, next) {
    let { latitude, longitude } = request.query;
    const key = process.env.YELP_API_KEY;
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&term=restaurants`;

    superagent.get(url)
        .set({ 'Authorization': 'Bearer ' + key })
        .then(yelpResponse => {
            let yelpData = yelpResponse.body.businesses;
            response.status(200).send(yelpData.map(idx => new Yelp(idx)))
        })
        .catch(error => handleError('yelp error : superagent bad', request, response, next));
}

function routeError(error, request, response, next) {
    response.status(404).send('Route not found');
}

function handleError(error, request, response, next) {
    response.status(500).send(error);
}


app.get('/location', handleLocation);
app.get('/weather', handleWeather);
// app.get('/trails', handleTrails);
app.get('/movies', handleMovie);
app.get('/yelp', handleYelp);

app.use(handleError);
app.use('*', routeError);

app.listen(PORT, () => {
    console.log('server is running on port: ' + PORT);
});

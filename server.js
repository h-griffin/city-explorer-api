const express = require('express'); //import library
const app = express(); //invoke express library
require('dotenv').config(); //import dotenv library
const PORT = process.env.PORT || 3000; //what port
const cors = require('cors'); //import cors library
app.use(cors());


function Location(geo, city) {
  this.search_query = city;
  this.formatted_query = geo.display_name;
  this.latitude = geo.lat;
  this.longitude = geo.lon;
}

app.get('/location', (request, response) => {
  let geo = require('./data/geo.json');//get info from geo.json

  let location = new Location(geo[0], 'city'); //new location / get first / city from request
  if (location) {
    response.status(200).send(location);
  }else{
    response.status(404).send('Cant find your city');
  }
});

app.listen(PORT, () => {
  console.log('Server is running on PORT: ' + PORT);

});

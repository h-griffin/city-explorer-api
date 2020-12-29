'use strict';

let __API_URL__;
let GEOCODE_API_KEY;

function setEventListeners() {
  $('#url-form').on('submit', function (event) {
    event.preventDefault();
    __API_URL__ = $('#back-end-url').val();
    $('#url-form').addClass('hide');
    manageForms();
  });

  $('#geocode-form').on('submit', function (event) {
    event.preventDefault();
    GEOCODE_API_KEY = $('#api-key').val();
    storeKey(GEOCODE_API_KEY);
    $('#geocode-form').addClass('hide');
    manageForms();
  });

  $('#search-form').on('submit', fetchCityData);
}

function getKey() {
  if (localStorage.getItem('geocode')) return JSON.parse(localStorage.getItem('geocode'));
}

function storeKey(key) {
  localStorage.setItem('geocode', JSON.stringify(key));
}

function manageForms() {
  let urlState = $('#url-form').hasClass('hide');
  let keyState = $('#geocode-form').hasClass('hide');

  if (urlState && keyState) { $('#search-form').removeClass('hide'); }
}

function fetchCityData(event) {
  event.preventDefault();

  // start off by cleaning any previous errors
  compileTemplate([], 'error-container', 'error-template');

  let searchQuery = $('#input-search').val().toLowerCase();

  const ajaxSettings = {
    method: 'GET',
    data: { city: searchQuery },
  };

  $.ajax(`${__API_URL__}/location`, ajaxSettings)
    .then(location => {
      displayMap(location);
      getResource('weather', location);
      getResource('movies', location);
      getResource('yelp', location);
    //   getResource('trails', location);
    })
    .catch(error => {
      compileTemplate([error], 'error-container', 'error-template');
      $('#map').addClass('hide');
      $('section, div').addClass('hide');
    });
}

function displayMap(location) {
  $('.query-placeholder').text(`Here are the results for ${location.formatted_query}`);

  $('#map').removeClass('hide');
  $('section, div').removeClass('hide');

  let lat = location.latitude;
  let lon = location.longitude;
  let width = 800;
  let height = 400;

  let mapURL = `https://maps.locationiq.com/v2/staticmap?key=${GEOCODE_API_KEY}&center=${lat},${lon}&size=${width}x${height}&zoom=12`;

  $('#map').attr('src', mapURL);
}

function getResource(resource, location) {
  const ajaxSettings = {
    method: 'get',
    dataType: 'json',
    data: location
  };

  $.ajax(`${__API_URL__}/${resource}`, ajaxSettings)
    .then(result => {
      console.log('get resource successful: ', resource);
      compileTemplate(result, `${resource}-results`, `${resource}-results-template`);
    })
    .catch(error => {
      compileTemplate([error], 'error-container', 'error-template');
    });
}

function compileTemplate(input, sectionClass, templateId) {
  $(`.${sectionClass}`).empty();

  let template = $(`#${templateId}`).text();

  input.forEach(element => {
    $(`.${sectionClass}`).append(Mustache.render(template, element));
  });
}

$(() => {
  setEventListeners();
  GEOCODE_API_KEY = getKey();
  if (GEOCODE_API_KEY) { $('#geocode-form').addClass('hide'); }
});



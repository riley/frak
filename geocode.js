'use strict';

var MongoClient = require('mongodb').MongoClient;
var fetch = require('node-fetch');
var key = 'AIzaSyB9DMFL0XFWHlJUyBaXAd2-vjesFkA2ilc';

const url = 'mongodb://localhost:27017/frak';

MongoClient.connect(url).then(db => {
  let Schools = db.collection('schools');

  Schools.find({loc: {$exists: false}}).toArray().then(schools => {
    let calls = schools.map(school => {
      return function () {
        var address = `${school.streetAddress}, ${school.city}, ${school.state} ${school.zip}`;

        var uri = `https://maps.googleapis.com/maps/api/geocode/json?key=${key}&address=${encodeURIComponent(address)}`;

        fetch(uri).then(response => {
          return response.json();
        }).then(json => {
          if (!json.results.length) {
            console.log('no results for', address);
            console.log(JSON.stringify(json, null, 2));
            process.exit();
          }

          var point = json.results[0].geometry.location;

          var loc = {type: 'Point', coordinates: [point.lat, point.lng]};

          console.log(address, point);

          Schools.updateOne({_id: school._id}, {$set: {loc}});
        });
      };
    });

    var counter = 0;
    setInterval(function () {
      calls[counter++]();

      if (counter === calls.length) {
        console.log('done');
        process.exit();
      }
    }, 101);

  });
});

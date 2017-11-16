if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const express = require('express');
const app = express();

const fetch = require('node-fetch');
const key = 'AIzaSyB9DMFL0XFWHlJUyBaXAd2-vjesFkA2ilc';

app.use(express.static('public'));

var db;
MongoClient.connect(process.env.MONGODB_URI).then(myDb => {
  db = myDb;
});

function exposeDb (req, res, next) {
  req.db = db;
  req.wells = db.collection('wells');
  req.schools = db.collection('schools');
  next();
}

app.get('/address', exposeDb, async (req, res) => {

  var address = encodeURI(req.params.address);
  var uri = `https://maps.googleapis.com/maps/api/geocode/json?key=${key}&address=${encodeURIComponent(address)}`;

  const response = await fetch(uri);

  const json = await response.json();
  res.json(json);
});

app.get('/search', exposeDb, async (req, res) => {

  let query = {
    loc: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [+req.query.lng, +req.query.lat]
        },
        $maxDistance: 5000,
        $minDistance: 0
      }
    }
  };

  const {schools, wells} = {
    schools: await req.schools.find(query).toArray(),
    wells: await req.wells.find(query).toArray()
  };

  res.json({schools, wells});
});

app.listen(process.env.PORT, () => console.log('listening on 3000'));

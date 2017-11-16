'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
var parse = require('csv-parse');
var _ = require('lodash');

const url = 'mongodb://localhost:27017/frak';

const toCamel = (snake) => {
  return snake.toLowerCase().replace(/(\_\w)/g, m => m[1].toUpperCase() );
};

MongoClient.connect(url).then(db => {
  let wells = db.collection('wells');

  var parser = parse({delimiter: ','}, function (err, data) {
    console.log(`there are ${data.length - 1} records`);

    var headers = _.head(data);

    headers = _.map(headers, toCamel);

    var records = _.map(_.tail(data), row => {

      var record = row.reduce((accum, val, i) => {
        accum[headers[i]] = val;
        return accum;
      }, {});

      for (var key in record) {
        if (_.isString(record[key])) {
          record[key] = record[key].trim();
        }
      }

      record.api = parseInt(record.api, 10);
      record.spudDate = new Date(record.spudDate);
      record.maxMd = parseInt(record.maxMd, 10);
      record.maxTvd = parseInt(record.maxTvd, 10);
      record.apiSeq = parseInt(record.apiSeq, 10);
      record.utmX = parseInt(record.utmX, 10);
      record.utmY = parseInt(record.utmY, 10);
      record.groundEle = parseInt(record.groundEle, 10);
      record.latitude = parseFloat(record.latitude, 10);
      record.longitude = parseFloat(record.longitude, 10);
      record.loc = {type: 'Point', coordinates: [record.latitude, record.longitude]};
      record.distEW = +record.distEW;
      record.distNS = +record.distNS;
      record.operatNum = parseInt(record.operatNum, 10);

      return {insertOne: {document: record}};
    });

    wells.bulkWrite(records).then(r => {
      console.log(`there were ${data.length - 1} records and ${r.insertedCount} inserted`);
    });
  });

  fs.createReadStream('./data/Wells.csv', {encoding: 'utf-8'}).pipe(parser);
});

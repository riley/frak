'use strict';

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
var parse = require('csv-parse');
var _ = require('lodash');
var assert = require('assert');

const url = 'mongodb://localhost:27017/frak';

MongoClient.connect(url).then(db => {
  let schools = db.collection('schools');

  var parser = parse({delimiter: ','}, function (err, data) {
    console.log(`there are ${data.length} records`);
    var records = _.map(_.tail(data), row => {
      // return {
      //   code: row[0],
      //   name: row[1],
      //   streetAddress: row[2],
      //   city: row[3],
      //   state: row[4],
      //   zip: row[5],
      //   phone: row[6],
      //   lowestGrade: row[7],
      //   highestGrade: row[8],
      //   type: row[9],
      //   districtCode: row[10],
      //   districtName: row[11],
      //   districtSize: row[12],
      //   districtSetting: row[13]
      // };
      //
      return {
        code: row[0],
        name: row[1],
        streetAddress: row[2],
        city: row[3],
        state: row[4],
        zip: row[5],
        phone: row[6],
        districtCode: row[7],
        districtName: row[8],
        county: row[10],
        grades: row[11],
        public: false
      };
    });

    schools.insertMany(records).then(result => {
      assert.equal(records.length, result.result.n);
      assert.equal(records.length, result.ops.length);
    }).then(() => {
      console.log('done');
      process.exit();
    }).catch(err => {
      console.log('error inserting many', err);
    });
  });

  fs.createReadStream('./data/private_schools.csv', {encoding: 'utf-8'}).pipe(parser);
});

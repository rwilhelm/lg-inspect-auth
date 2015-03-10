(function () {
  'use strict';

  // TODO clean this up. either mix requests and db queries or separate them
  // completely.

  var Router = require('koa-router');

  // arg: [ 1389559420371, 1389559423048 ]
  function extentToSQL(extent) {
    var e = extent.split(',');
    return ' AND ts >= ' + e[0] + ' AND ts <= ' + e[1];
  }

  // sensor tables w/ ts, x, y and z columns
  var sensors = [
    'sensor_accelerometer',
    'sensor_gravity',
    'sensor_gyroscope',
    'sensor_linear_acceleration',
    'sensor_magnetic_field',
    'sensor_rotation'
  ];

  var moreSensors = [
    'sensor_gps',
    'sensor_har',
    'sensor_tags'
  ];

  // specify and generate sql queries here
  var queries = {
    check: function (id) {
      return sensors.concat(moreSensors).map(function (sensor) {
        return 'SELECT EXISTS(SELECT 1 FROM ' + sensor + ' WHERE trip_id = ' + id + ') AS ' + sensor;
      }).join('; ');
    },

    count: function (id) {
      return sensors.concat(moreSensors).map(function (sensor) {
        return 'SELECT (SELECT COUNT(ts) FROM ' + sensor + ' WHERE trip_id = ' + id + ') AS ' + sensor;
      }).join('; ');
    },

    sensor: function (id, sensor, windowSize, extent) {
      var q;
      if (sensor === 'sensor_har') {
        q = 'SELECT ts, tag FROM sensor_har WHERE trip_id = ' + id + 'ORDER BY ts ASC';
      } else if (sensor === 'sensor_gps') {
        q = 'SELECT ts, ST_AsGeoJSON(lonlat)::json AS lonlat FROM sensor_gps WHERE trip_id = ' + id + 'ORDER BY ts ASC';
      } else if (sensor === 'sensor_tags') {
        q = 'SELECT * FROM sensor_tags WHERE trip_id = ' + id + 'ORDER BY ts ASC';
      } else if (windowSize) {
        q = 'SELECT avg(x) AS x, avg(y) AS y, avg(z) AS z, min(ts) AS start, max(ts) AS stop FROM (SELECT x, y, z, ts, NTILE(' + windowSize + ') OVER (ORDER BY ts) AS w FROM ' + sensor + ' WHERE trip_id = ' + id + extent + ') A GROUP BY w ORDER BY w';
      } else {
        q = 'SELECT * from ' + sensor + ' WHERE trip_id = ' + id + extent + 'ORDER BY ts ASC';
      }
      return q;
    },

    delete: function (id) {
      // mark trip as deleted
      return 'UPDATE trip SET deleted = true WHERE trip_id = ' + id;
    },

    undelete: function (id) {
      // mark trip as deleted
      return 'UPDATE trip SET deleted = false WHERE trip_id = ' + id;
    },

    update: function (id, data) {
      // parse the request body and create key-value-pairs as part of the sql statement
      var fields = Object.keys(data).map(function (key) {
        return key + ' = \'' + data[key] + '\'';
      }, this).join(', ');

      return 'UPDATE trip SET ' + fields + ' WHERE trip_id = ' + id;
    },
  };

  module.exports = exports = new Router()
    .get('/trips/:tripId/check', hasData())
    .get('/trips/:tripId/count', countData())
    .get('/trips/:tripId/:sensor', getData())
    .get('/trips', getTrips())
    .del('/trips/:tripId', deleteTrip())
    .post('/trips/:tripId', updateTrip());

  // check a trip for available sensor data
  //   curl -s localhost:3476/trips/850/check
  function hasData() {
    return function* () {
      var result =
        yield this.pg.db.client.query_();
      this.body = result.rows;
    };
  }

  // count sensor data for a trip
  //   curl -s localhost:3476/trips/850/count
  function countData() {
    return function* () {
      var result =
        yield this.pg.db.client.query_(queries.count(this.params.tripId));
      this.body = result.rows;
    };
  }

  // get sensor data for a trip
  //   curl -s localhost:3476/trips/850/acc
  //   curl -s localhost:3476/trips/850/acc\?w=200
  //   curl -s localhost:3476/trips/850/acc\?w=200\&e=1394518675333,1394518346639
  function getData() {
    return function* () {
      var extent = this.query.e ? extentToSQL(this.query.e) : '';
      var result =
        yield this.pg.db.client.query_(
          queries.sensor(this.params.tripId, this.params.sensor, this.query.w, extent));
      this.body = result.rows;
    };
  }

  // get all trips
  //   curl -s localhost:3476/trips
  function getTrips() {
    return function* () {
      let query = `SELECT trip_id AS id, user_id AS user, start_ts AS start, stop_ts AS stop, name AS comment FROM trip WHERE user_id = $1 ORDER BY trip_id DESC`;
      let values = [this.auth.username]; // XXX this.auth is set in auth.js
      var result =
        yield this.pg.db.client.query_(query, values);
      this.body = result.rows;
    };
  }

  // delete a trip
  function deleteTrip() {
    return function* () {
      yield this.pg.db.client.query_(queries.delete(this.params.tripId));
      this.status = 204;
    };
  }

  // update a trip
  function updateTrip() {
    return function* () {
      yield this.pg.db.client.query_(queries.update(this.params.tripId, this.request.body));
      this.status = 204;
    };
  }

}());

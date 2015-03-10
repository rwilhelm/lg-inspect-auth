'use strict';

module.exports = {
  port: process.env.PORT || 3001,
  db: process.env.DB || 'pg://postgres:liveandgov@localhost:3333/liveandgov_dev'
};

(function () {
  'use strict';
  // jshint esnext:true

  let path = require('path');
  let os = require('os');

  let app = require('koa')();
  let body = require('koa-body');
  let compress = require('koa-compress');
  let logger = require('koa-logger');
  let mount = require('koa-mount');
  let pg = require('koa-pg');
  let serve = require('koa-static');
  let views = require('koa-views');

  let chalk = require('chalk');

  let config = require('./config');
  let auth = require('./auth');
  let api = require('./routes');

  const PUBLIC_DIR = path.join(__dirname, 'public');
  const BOWER_DIR = path.join(__dirname, 'bower_components');

  app.use(views(__dirname + '/src/jade', {
    default: 'jade',
    cache: false
  }));

  app.use(logger());
  app.use(body());
  app.use(compress());
  app.use(pg(config.db));

  app.use(mount('/', serve(PUBLIC_DIR)));
  app.use(mount('/bower_components', serve(BOWER_DIR)));

  app.use(function* (next) {
    if (this.request.url === '/logout') {
      delete this.headers.authorization;
      this.status = 401;
    } else {
      yield next;
    }
  });

  app.use(function* (next) {
    try {
      yield next;
    } catch (err) {
      if (401 === err.status) {
        this.status = 401;
        this.set('WWW-Authenticate', 'Basic realm="Live+Gov Inspection Front End"');
        // this.body = 'cant haz that';
      } else {
        throw err;
      }
    }
  });

  app.use(auth); // must be authenticated from here on

  app.use(mount('/v1', api.middleware()));

  app.use(function* (next) {
    if (this.request.url === '/') {
      yield this.render('index', {
        env: process.env.NODE_ENV
      });
    } else {
      yield next;
    }
  });

  // start the server
  if (!module.parent) {
    app.listen(config.port);
  }

  console.log(chalk.green('\n>> live+gov inspection front end server started'));
  console.log(chalk.blue(`>> ${new Date()}`));
  console.log(chalk.magenta(`>> ${config.db}`));

  let hostAddr = os.networkInterfaces().en0[1].address || os.networkInterfaces().eth0[1].address || 'localhost';

  console.log(chalk.yellow(`>> http://${hostAddr}:${config.port} || http://${os.hostname()}:${config.port}`));
  console.log();

}());

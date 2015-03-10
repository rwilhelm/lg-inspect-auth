(function () {
  'use strict';

  // live+gov authentication:
  // sets this.auth, which is utilizied during db queries

  module.exports = exports = function* (next) {

    if (!this.headers.hasOwnProperty('authorization')) {
      this.status = 401;
      this.throw(401, 'UNAUTHORIZED (no auth header)');
    }

    let auth = authDecode(this.headers.authorization); // [username, password]
    let query = `SELECT * from auth WHERE username = $1`;
    let values = auth.slice(0, 1);

    var result =
      yield this.pg.db.client.query_(query, values);

    if (result.rowCount === 1) {
      if (auth[1] === result.rows[0].password) {
        this.auth = result.rows[0]; /// XXX set this.auth
        console.log(this.auth);
        yield next;
      } else {
        this.throw(401, 'UNAUTHORIZED (wrong password)');
      }
    } else {
      this.throw(401, 'UNAUTHORIZED (unknown user)');
    }
  };

  function authDecode(authHeader) {
    var buf = new Buffer(authHeader.split(' ')[1], 'base64');
    return buf.toString().split(':');
  }

}());

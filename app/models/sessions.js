var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var Session = db.Model.extend({
  tableName: 'sessions',
  hasTimestamps: false
});

module.exports = Session;

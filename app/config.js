var Bookshelf = require('bookshelf');
var path = require('path');

var db = Bookshelf.initialize({
  client: 'sqlite3',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'password',
    database: 'shortlydb',
    charset: 'utf8',
    filename: path.join(__dirname, '../db/shortly.sqlite')
  }
});

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('base_url', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Urls Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('link_id');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Clicks Table', table);
    });
  }
});

/************************************************************/
// Add additional schema definitions below
/************************************************************/

db.knex.schema.hasTable('users').then(function(exists) {
  if(!exists) {
    db.knex.schema.createTable('users', function(table){
      table.increments('id').primary();
      table.string('username', 40);
      table.string('password', 120);
      table.string('salt', 120);
    }).then(function(table){
      console.log('Created Users Table ', table);
    });
  }
});

db.knex.schema.hasTable('sessions').then(function(exists) {
  if(!exists) {
    db.knex.schema.createTable('sessions', function(table) {
      table.increments('id').primary();
      table.integer('userid');
      table.string('sessionid', 90);
    }).then(function(table) {
      console.log('Created Sessions Table', table);
    });
  }
});


module.exports = db;

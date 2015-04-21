var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
//var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2').OAuth2Strategy;

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Use Passport/Oauth
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    clientID: 'c37d88a9f85944ce119b',
    clientSecret: '3238cd6a585e2fc867f3260d5e52a4f61930dd31',
    callbackURL: 'http://localhost:4568/github'
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ exampleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

// function to check for current session, otherwise send to login
var restrict =  function(req,res,next) {
  console.log(req.session);
  if(req.session.loggedin) {
    next();
  } else {
    res.redirect(301,"/login");
  }
};


app.get('/', restrict, function(req,res) {
  res.render('index');
});

app.get('/create', restrict,
function(req, res) {
  res.render('index');
});

app.get('/links', restrict,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req,res) {
  res.render('login');
});

app.post('/login', passport.authenticate, function(req,res) {

});

app.get('/signup', function(req,res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {

});

app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback',
        passport.authenticate('github', { successRedirect: '/',
                                            failureRedirect: '/login' }));


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

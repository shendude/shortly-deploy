var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');

var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }
  var query = Link.findOne({url: uri});
  query.then(function(result) {
    if (result) {
      res.status(200).send(result.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save().then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.status(200).send(found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.sendStatus(404);
  //       }
  //       var newLink = new Link({
  //         url: uri,
  //         title: title,
  //         baseUrl: req.headers.origin
  //       });
  //       newLink.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.status(200).send(newLink);
  //       });
  //     });
  //   }
  // });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var query = User.find({username: username});
  query.then(function(result) {
    console.log('users db: ' , result);
    if (!result) {
      res.redirect('/login');
    } else {
      User.comparePassword(password, result.password)
      .then(function(match) {
        if (match) {
          util.createSession(req, res, result);
        } else {
          res.redirect('/login');
        }
      })
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var query = User.findOne({username: username});
  query.then(function(result) {
    if (!result) {
      console.log('find user result: ' , result);
      new User({username: username, password: password}).save()
      .then(function(newUser) {
        console.log('new created user: ' , newUser);
        util.createSession(req, res, newUser);
      });
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });

};

exports.navToLink = function(req, res) {

  var query = Link.findOne({code: req.params[0]});
  query.then(function(result) {
    if (!result) {
      res.redirect('/');
    } else {
      result
      .save({_id: result._id, visits: result.visits + 1})
      .then(function(result) {
        return res.redirect(result.url);
      });
    }
  });

  // new Link({ code: req.params[0] }).fetch().then(function(link) {
  //   if (!link) {
  //     res.redirect('/');
  //   } else {
  //     link.set({ visits: link.get('visits') + 1 })
  //       .save()
  //       .then(function() {
  //         return res.redirect(link.get('url'));
  //       });
  //   }
  // });
};

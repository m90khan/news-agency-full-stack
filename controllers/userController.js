// import models
const User = require("../models/User");
const Post = require("../models/Post");

exports.login = (req, res) => {
  let user = new User(req.body);
  user
    .login()
    .then((result) => {
      /*
       -create a property named session in req object that will be unique for every user
      - we are changing the data and saving it in the database as it asynchrounously. it happens automatically
      - but we have to wait for it before redirecting it. so we manually save it 
      -  req.session.save(() => { res.redirect("/");});
      */
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id,
      };
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch((err) => {
      // error using flash (array of messages, actual message)
      req.flash("errors", err); // madd and remove data from session data from database
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// - logout
exports.logout = (req, res) => {
  /* - if the current session has a matched cookie, destroy the session from db and browser and redirect to Home */
  req.session.destroy(() => {
    res.redirect("/");
  });
};

//-register
exports.register = (req, res) => {
  let user = new User(req.body);
  // - could use await but an also use then , catch
  user
    .register()
    .then(() => {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id,
      };
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch((regErrors) => {
      // res.send(user.errors);
      regErrors.forEach((err) => {
        req.flash("regErrors", err);
      });
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// - Home
exports.home = (req, res) => {
  if (req.session.user) {
    /*
   - res.render(name of template to render, data to pass into the template)
    */
    res.render("home-dashboard");
  } else {
    res.render("home-guest", {
      regErrors: req.flash("regErrors"), // register errors
    });
  }
};

exports.mustBeLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to create a post");
    req.session.save(() => {
      res.redirect("/");
    });
  }
};

// * User Profile

exports.ifUserExists = (req, res, next) => {
  /*
 check if user typed username exists or not . url/profile/(check this with database)
 */

  User.findByUsername(req.params.username)
    .then((userDocument) => {
      // - create a new property and set it equal to document that we just found
      req.profileUser = userDocument;
      next();
    })
    .catch(() => {
      res.render("404");
    });
};

exports.profilePostsScreen = (req, res) => {
  // ask post model for posts by a certain user id
  Post.findByAuthorId(req.profileUser._id)
    .then((posts) => {
      res.render("profile", {
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
      });
    })
    .catch(() => {
      res.render("404");
    });
};

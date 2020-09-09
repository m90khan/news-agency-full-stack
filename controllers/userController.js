// import models

const User = require("../models/User");

exports.login = (req, res) => {
  let user = new User(req.body);
  user
    .login()
    .then((result) => {
      // create a property in session that will be uniue for every user
      req.session.user = { avatar: user.avatar, username: user.data.username };
      req.session.save(() => {
        res.redirect("/");
      });
    })
    .catch((err) => {
      // error using flash (array of messages, actual message)
      req.flash("errors", err); // modify session data
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
// - logout
exports.logout = (req, res) => {
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
      req.session.user = { username: user.data.username, avatar: user.avatar };
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
    res.render("home-dashboard", {
      username: req.session.user.username,
      avatar: req.session.user.avatar,
    });
  } else {
    res.render("home-guest", {
      errors: req.flash("errors"),
      regErrors: req.flash("regErrors"),
    });
  }
};

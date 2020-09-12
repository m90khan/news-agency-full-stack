// import models
const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

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
exports.home = async (req, res) => {
  if (req.session.user) {
    /*
    - fetch feed of post from current user
   - res.render(name of template to render, data to pass into the template)
    */

    let posts = await Post.getFeed(req.session.user._id);
    res.render("home-dashboard", { posts: posts });
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
        currentPage: "posts",
        posts: posts,
        title: `Profile for ${req.profileUser.username}`,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isVisitorsProfile: req.isVisitorsProfile,
        isFollowing: req.isFollowing,
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch(() => {
      res.render("404");
    });
};

exports.sharedProfileData = async (req, res, next) => {
  /*
  - we are checking to see if the visitor id and profile id exists in the databse
  */
  let isFollowing = false;
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);

    isFollowing = await Follow.isVisitorFollowing(
      req.profileUser._id,
      req.visitorId
    );
  }
  req.isVisitorsProfile = isVisitorsProfile;
  req.isFollowing = isFollowing;

  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
  let [postCount, followerCount, followingCount] = await Promise.all([
    postCountPromise,
    followerCountPromise,
    followingCountPromise,
  ]);

  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;
  next();
};

exports.profileFollowersScreen = async (req, res) => {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render("profile-followers", {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isVisitorsProfile: req.isVisitorsProfile,
      isFollowing: req.isFollowing,
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
    });
  } catch {
    res.render("404");
  }
};

exports.profileFollowingScreen = async (req, res) => {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isVisitorsProfile: req.isVisitorsProfile,
      isFollowing: req.isFollowing,
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
    });
  } catch {
    res.render("404");
  }
};

exports.doesUsernameExist = (req, res) => {
  User.findByUsername(req.body.username)
    .then(() => {
      res.json(true);
    })
    .catch(() => {
      res.json(false);
    });
};

exports.doesEmailExist = async (req, res) => {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

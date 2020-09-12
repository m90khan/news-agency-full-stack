// Topic: to list all routes

const express = require("express");
const router = express.Router();

// import all functions for the routes
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");
//* User Related Routes
//- homepage (guest / Dashboard)
router.get("/", userController.home);
// - Register
router.post("/register", userController.register);
// - Login
router.post("/login", userController.login);
// -logout
router.post("/logout", userController.logout);
//- Registeration Form validation
router.post("/doesUsernameExist", userController.doesUsernameExist);
router.post("/doesEmailExist", userController.doesEmailExist);

// * Profile Related Routes
// - Profile : if user exists, shared follow profile data, posts screen
router.get(
  "/profile/:username",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profilePostsScreen
);
router.get(
  "/profile/:username/followers",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowersScreen
);

router.get(
  "/profile/:username/following",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowingScreen
);

// *  Post related routes
// -create Post
//- we can pass in multiple arguments, we can check if the user is logged in , if yes then proceed next argument else guest hoem scrren
router.get(
  "/create-post",
  userController.mustBeLoggedIn,
  postController.viewCreateScreen
);

router.post(
  "/create-post",
  userController.mustBeLoggedIn,
  postController.create
);

router.get("/post/:id", postController.viewSingle);
router.get(
  "/post/:id/edit",
  userController.mustBeLoggedIn,
  postController.viewEditScreen
);
router.post(
  "/post/:id/edit",
  userController.mustBeLoggedIn,
  postController.edit
);

router.post(
  "/post/:id/delete",
  userController.mustBeLoggedIn,
  postController.delete
);

// - Search

router.post("/search", postController.search);

//- Follow
router.post(
  "/addFollow/:username",
  userController.mustBeLoggedIn,
  followController.addFollow
);
router.post(
  "/removeFollow/:username",
  userController.mustBeLoggedIn,
  followController.removeFollow
);
module.exports = router;

// Topic: to list all routes

const express = require("express");
const router = express.Router();

// import all functions for the routes
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
//* User Related Routes
//- homepage (guest / Dashboard)
router.get("/", userController.home);
// - Register
router.post("/register", userController.register);
// - Login
router.post("/login", userController.login);
// -logout
router.post("/logout", userController.logout);

// * Profile Related Routes
// - Profile
router.get(
  "/profile/:username",
  userController.ifUserExists,
  userController.profilePostsScreen
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
module.exports = router;

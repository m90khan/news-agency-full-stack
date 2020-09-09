// Topic: to list all routes

const express = require("express");
const router = express.Router();

// import all functions for the routes
const userController = require("./controllers/userController");

//- homepage (guest)
router.get("/", userController.home);
// - Register
router.post("/register", userController.register);
// - Login
router.post("/login", userController.login);

// -logout
router.post("/logout", userController.logout);

module.exports = router;

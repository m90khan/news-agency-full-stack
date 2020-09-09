/*
views folder : to keep ejs files/ server side
public: to eep client/ browser based. css, 


* Organization
- Router (router.js) :  to organize all routes in one file
- Controller  : to keep the functions associated with routes
-db.js : for database connection
- use bcryptjs to hash passwords

*Session
- HTTP requests are stateless. so once user login . http request is over 
- so how can we trust or identify requests? after that point.  1. Sessions  2. Tokens 
 
- Flash Messaging: to display error  connect-flash

* MVC : Model View Controller
- Model: includes all the logic/rules
- Views: contains the front -end 
- Controller:  middlewear: communicates between views and models. depending on the model, display the view


    "bcryptjs": "^2.4.3",     // 
    "connect-flash": "^0.1.1",
    "connect-mongo": "^3.2.0",
    "dotenv": "^8.2.0",
    "ejs": "^3.1.5",
    "express": "^4.17.1",
    "express-session": "^1.17.1",
    "md5": "^2.3.0",
    "mongodb": "^3.6.1",
    "validator": "^13.1.1"

*/

// use express to create a server
const express = require("express");
// use express router to create a router for all the routes

const router = require("./router");
// initialize the server
const app = express();
// to store session into mongo database

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const flash = require("connect-flash");

const sessionOptions = session({
  secret: "COOL",
  store: new MongoStore({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }, // how long the cookie will last
});

app.use(sessionOptions);
app.use(flash());
app.use(express.urlencoded({ extended: false })); // to allow user submitted data on req object
app.use(express.json());
// to allow browser side files.  files that are accessible to everyone
app.use(express.static("public"));

// first argument has to be views and second is the folder name of html templates
// then we also have to set the view engine template. which in our case is ejs
app.set("views", "views");
app.set("view engine", "ejs");

// to tell express to use router for routes
// takes two arguments, (which url to use, router to use)
app.use("/", router);

module.exports = app;

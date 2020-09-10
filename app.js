/*
views folder : to keep ejs files/ server side
public: to eep client/ browser based. css, 

*A template engine enables you to use static template files in your application.
- At runtime, the template engine replaces variables in a template file with 
-actual values, and transforms the template into an HTML file sent to the client.
- This approach makes it easier to design an HTML page.

* Organization
- Router (router.js) :  to organize all routes in one file
- Controller  : to keep the functions associated with routes
-db.js : for database connection
- use bcryptjs to hash passwords

*Session
- HTTP requests are stateless. so once user login . http request is over 
- so how can we trust or identify requests? after that point.  1. Sessions  2. Tokens 
 
*Cookie
- An HTTP cookie (also called web cookie, Internet cookie, browser cookie, or simply cookie)
- is a small piece of data stored on the user's computer by the web browser while browsing a website.
-  Cookies were designed to be a reliable mechanism for websites to remember stateful information 
-  (such as items added in the shopping cart in an online store) or to record the user's browsing 
-  activity (including clicking particular buttons, logging in, or recording which pages were visited
-  in the past). They can also be used to remember pieces of information that the user previously
-  entered into form fields, such as names, addresses, passwords, and payment card numbers.

- Flash Messaging: to display error  connect-flash

* MVC : Model View Controller
- Model: includes all the logic/rules
- Views: contains the front -end 
- Controller:  middlewear: communicates between views and models. depending on the model, display the view

    
     -  WHen a user login , use bcrypt package to compare hash passwords     
    "bcryptjs": "^2.4.3",   
    "connect-flash": "^0.1.1",
    "connect-mongo": "^3.2.0",
    -Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env 
    "dotenv": "^8.2.0",
    - template engine 
    "ejs": "^3.1.5", 
     - framework to create web server
    "express": "^4.17.1",
    "express-session": "^1.17.1",
    - to convert email into md5 hashing code which gravatar uses
    "md5": "^2.3.0",
     - mongodb database package
    "mongodb": "^3.6.1",
    - to validate string data like email, numeric , alphanumeric 
    "validator": "^13.1.1"    

*/

// use express to create a server
const express = require("express");
// use express router to create a router for all the routes
const router = require("./router");
// initialize the server
const app = express();
// * to store session into brower as cookie
// as http is stateless so keep state once user login.
// two ways: session and tokens. we are using sessions here
// session: two things happens: server store data as session and create cookie in the browser
const session = require("express-session");
/*
* Store session in the db
- Because express-session store session data in the browser so everytime server
- refresh, it loses that data. 
- use connect-mongo to store session data into the browser
*/
const MongoStore = require("connect-mongo")(session);

/*
 * to display messages temporarlity like login error
 */
const flash = require("connect-flash");

//- to allow html in the post body
const markdown = require("marked");
const sanitizeHTML = require("sanitize-html");

const sessionOptions = session({
  secret: "fullstackAPP", // a string that outside could not guess
  // by default, session data is store in memory but we can overwrite to store in database
  store: new MongoStore({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  // how long the cookie will last (second, minute, hour, day)
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
});

app.use(sessionOptions);
app.use(flash());

/*
{  username: req.session.user.username, avatar: req.session.user.avatar}
- remove duplication of session data being passed in every controller
- create a middlewear 
- res.locals : an object which will be avaialble in ejs templates
- we are adding a user property equals to session user property

- the below function tells app to run this fnction for every route, once it sets the property
- proceed to the next function 
*/
app.use((req, res, next) => {
  //- to allow markdown in ejs templates
  res.locals.filterUserHTML = (content) => {
    return sanitizeHTML(markdown(content), {
      allowedTags: [
        "p",
        "br",
        "ul",
        "ol",
        "strong",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "bold",
        "i",
      ],
      allowedAttributes: {},
    });
  };

  //- make all errors and success avaialable in all templates
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");

  // -make current user id avaialbale in req object

  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }

  //- make user session data available in view templates
  res.locals.user = req.session.user;
  next();
});

// - to allow user submitted form data on req object
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // to send json data
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

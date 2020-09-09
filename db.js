const mongodb = require("mongodb");
// -Dotenv is a zero-dependency module that loads environment
// - variables from a .env file into process.env.
const dotenv = require("dotenv"); //
dotenv.config(); // - log all the value from .env file to fotenv variable
mongodb.connect(
  process.env.CONNECTIONSTRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    module.exports = client; //- return the databse object that we can work with
    const app = require("./app");

    app.listen(process.env.PORT);
  }
);

// - to validate email along with other data
const validator = require("validator");
// - getting User data from databasse
const userCollection = require("../db").db().collection("users");
// - hashing passwords
const bcrypt = require("bcryptjs");
// - md5
const md5 = require("md5");
const { get } = require("../router");

// Initiate a class
class User {
  constructor(data, getAvatar) {
    this.data = data;
    this.errors = [];
    if (getAvatar == undefined) {
      getAvatar = false;
    }
    if (getAvatar) {
      this.getAvatar();
    }
  }

  //* USER REGISTER
  async register() {
    return new Promise(async (resolve, reject) => {
      // - 1 : validate user data
      this.cleanUp(); //clean the input data
      // because we added async to validate method so we need to make sure that the validate completes before moving next
      // because the  validate method returns a promise  so use await to wait for the promise to return
      await this.validate();

      // - 2: if no errors then user data is saved into the database
      if (!this.errors.length) {
        /*
       - hash user passwords
       - its a two step process 
       - first, create a salt sync then update the password value to salt
      */
        let salt = bcrypt.genSaltSync(10);
        //- now overwrite the user password value before insert
        this.data.password = bcrypt.hashSync(this.data.password, salt);
        await userCollection.insertOne(this.data);
        this.getAvatar();

        resolve();
      } else {
        reject(this.errors);
      }
    });
  }

  cleanUp() {
    if (typeof this.data.username != "string") {
      this.data.username = "";
    }
    if (typeof this.data.email != "string") {
      this.data.email = "";
    }
    if (typeof this.data.password != "string") {
      this.data.password = "";
    }
    // to get rid unknown data
    this.data = {
      username: this.data.username.trim().toLowerCase(),
      email: this.data.email.trim().toLowerCase(),
      password: this.data.password,
    };
  }

  validate() {
    return new Promise(async (resolve, reject) => {
      if (this.data.username == "") {
        this.errors.push("you must provide username");
      }
      if (
        this.data.username != "" &&
        !validator.isAlphanumeric(this.data.username)
      ) {
        this.errors.push("Username can only contain letters and numbers");
      }
      if (this.data.password == "") {
        this.errors.push("you must enter password");
      }
      if (!validator.isEmail(this.data.email)) {
        this.errors.push("you must enter email");
      }
      if (this.data.password.length > 0 && this.data.password.length < 10) {
        this.errors.push("Password must be atleast 10 characters");
      }
      if (this.data.password.length > 30) {
        this.errors.push("Password cannot exceed 30 characters");
      }
      if (this.data.username.length > 0 && this.data.username.length < 3) {
        this.errors.push("Username must be atleast 3 characters");
      }
      if (this.data.username.length > 30) {
        this.errors.push("Username cannot exceed 30 characters");
      }
      // - Only if username is valid then check with database if already taken
      if (
        this.data.username.length > 2 &&
        this.data.username.length < 31 &&
        validator.isAlphanumeric(this.data.username)
      ) {
        let usernameExists = await userCollection.findOne({
          username: this.data.username,
        });
        if (usernameExists) {
          this.errors.push("Username already Taken !!!");
        }
      }
      // - Only if email is valid then check with database if already taken
      if (validator.isEmail(this.data.email)) {
        let emailExists = await userCollection.findOne({
          email: this.data.email,
        });
        if (emailExists) {
          this.errors.push("Email already exists !!!");
        }
      }

      resolve(); // - to sigalify tat the above actions have been completed
    });
  }

  // * USER LOGIN
  login() {
    return new Promise((resolve, reject) => {
      this.cleanUp();
      userCollection
        .findOne({ username: this.data.username })
        .then((user) => {
          // if (user && user.password == this.data.password) {
          /*
          - WHen a user login , use bcrypt package to compare hash passwords
          - bcrypt.compareSync(password user just typed in, hashed valued from the dataabase )
         */
          if (user && bcrypt.compareSync(this.data.password, user.password)) {
            //  for avatar image to display :we only use username and password to login so we need to make sure the we also have email
            this.data = user;
            this.getAvatar();
            resolve(" You are logged in");
          } else {
            reject("Invalid User : Either username or Password is incorrect");
          }
        })
        .catch((err) => {
          reject("Something went wrong : Please try again later");
        });
    });
  }

  getAvatar() {
    /* to get gravatar avatar profiel image : */
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?128`;
  }
}

// -not taking oop appraoch
User.findByUsername = (username) => {
  return new Promise((resolve, reject) => {
    if (typeof username != "string") {
      reject();
      return; // if id does not match : we return. no futher execution
    }

    userCollection
      .findOne({ username: username })
      .then((userDoc) => {
        if (userDoc) {
          /* 
          -clean up the user data 
          - take the user data from the databse and create a new document  and true to get the avatar*/
          userDoc = new User(userDoc, true);
          userDoc = {
            _id: userDoc.data._id,
            username: userDoc.data.username,
            avatar: userDoc.avatar,
          };

          resolve(userDoc);
        } else {
          reject();
        }
      })
      .catch(() => {
        reject();
      });
  });
};
module.exports = User;

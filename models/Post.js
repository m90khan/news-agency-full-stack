// - getting User data from databasse
const postCollection = require("../db").db().collection("posts");

// - mongo db has a unique way of storing id. pass in single string and it will treat it as special ID obejcts
const ObjectID = require("mongodb").ObjectID;
const User = require("./User");
const sanitizeHTML = require("sanitize-html");

class Post {
  constructor(data, userid, reqPostId) {
    this.data = data;
    this.errors = [];
    this.userid = userid;
    this.reqPostId = reqPostId;
  }

  create() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      this.validate();
      if (!this.errors.length) {
        const postInsert = await postCollection.insertOne(this.data);
        if (postInsert) {
          resolve(postInsert.ops[0]._id);
        } else {
          this.errors.push("Something went wrong: Please try again Later");
          reject(this.errors);
        }
        resolve();
      } else {
        reject(this.errors);
      }
    });
  }

  cleanUp() {
    if (typeof this.data.title != "string") {
      this.data.title = "";
    }
    if (typeof this.data.body != "string") {
      this.data.body = "";
    }

    // to get rid unknown data
    this.data = {
      title: sanitizeHTML(this.data.title.trim(), {
        allowedAttributes: [],
        allowedTags: [],
      }),

      body: sanitizeHTML(this.data.body.trim(), {
        allowedAttributes: [],
        allowedTags: [],
      }),
      createdDate: new Date(),
      author: ObjectID(this.userid),
    };
  }
  validate() {
    return new Promise(async (resolve, reject) => {
      if (this.data.title == "") {
        this.errors.push("You must provide title for the post");
      }
      if (this.data.body == "") {
        this.errors.push("Post content cannot be empty");
      }
    });
  }

  // edit post
  update() {
    return new Promise(async (resolve, reject) => {
      // already has a method findsinglebyid

      try {
        let post = await Post.findSingleById(this.reqPostId, this.userid);
        if (post.isVisitorOwner) {
          // update the db
          let status = await this.actualUpdate();

          resolve(status);
        } else {
          reject();
        }
      } catch {}
    });
  }

  actualUpdate() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      this.validate();
      if (!this.errors.length) {
        await postCollection.findOneAndUpdate(
          { _id: new ObjectID(this.reqPostId) },
          { $set: { title: this.data.title, body: this.data.body } }
        );
        resolve("success");
      } else {
        reject("failure");
      }
    });
  }
}

// edit post

/*

*/

Post.reuseablePostQuery = (uniqueOperations, visitorId) => {
  return new Promise(async (resolve, reject) => {
    let aggOperations = uniqueOperations.concat([
      {
        //- perform match on author(as we stored id) from posts to users field id,
        // - then we create a as property to contain the macthing data
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDocument",
        },
      },
      {
        /*
    posts now return a matched object with all the properties. as we do not need all the properties. we can use
      another aggregate operator called $project : allows to define the fields that we want
            */
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: "$author",
          author: { $arrayElemAt: ["$authorDocument", 0] },
        },
      },
    ]);

    /*
         let post = await postCollection.findOne({ _id: new ObjectID(id) });
- based on the author id in post collection, look up for the user gravatar and username
* use aggregate([{$match: what to match with},{$lookup: lookup documents from another collections}]) :
-  return data array , even if contain one item
-agregate does not manipulate data in database. it simple return matched data to be used
    let posts = await postCollection.aggregate([{ $match: { _id: new ObjectID(id) } }, { $lookup: {from: "users",localField: "author",foreignField: "_id", as: "authorDocument", }, }, {  
          $project: {title: 1, body: 1, createdDate: 1, author: { $arrayElemAt: ["$authorDocument", 0] }, },  }, ]).toArray();
*/

    let posts = await postCollection.aggregate(aggOperations).toArray();

    // clean up author property in each post object so not to get password etc
    posts = posts.map(function (post) {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };

      return post;
    });

    resolve(posts);
  });
};

Post.findSingleById = (id, visitorId) => {
  return new Promise(async (resolve, reject) => {
    if (typeof id != "string" || !ObjectID.isValid(id)) {
      reject();
      return; // if id does not match : we return. no futher execution
    }

    let posts = await Post.reuseablePostQuery(
      [{ $match: { _id: new ObjectID(id) } }],
      visitorId
    );

    if (posts.length) {
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

// to get posts from database
Post.findByAuthorId = (authorId) => {
  return Post.reuseablePostQuery([
    { $match: { author: authorId } },
    { $sort: { createdDate: -1 } }, // 1 for ascending , -1 for descending order
  ]);
};

Post.delete = (postIdToDelete, currentUserId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        await postCollection.deleteOne({ _id: new ObjectID(postIdToDelete) });
        resolve();
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

module.exports = Post;

const userCollection = require("../db").db().collection("users");
const followCollection = require("../db").db().collection("follows");
const User = require("../models/User");

const ObjectID = require("mongodb").ObjectID;

class Follow {
  constructor(followedUser, authorId) {
    this.followedUser = followedUser;
    this.authorId = authorId;
    this.errors = [];
  }

  create() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      await this.validate("create");

      if (!this.errors.length) {
        await followCollection.insertOne({
          followedId: this.followedId,
          authorId: new ObjectID(this.authorId),
        });
        resolve();
      } else {
        reject(this.errors);
      }
    });
  }

  delete() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      await this.validate("delete");

      if (!this.errors.length) {
        await followCollection.deleteOne({
          followedId: this.followedId,
          authorId: new ObjectID(this.authorId),
        });
        resolve();
      } else {
        reject(this.errors);
      }
    });
  }

  cleanUp() {
    if (typeof this.followedUser != "string") {
      this.followedUser = "";
    }
  }
  async validate(action) {
    // followedUsername must exist in database
    let followedAccount = await userCollection.findOne({
      username: this.followedUser,
    });
    if (followedAccount) {
      this.followedId = followedAccount._id;
    } else {
      this.errors.push("You cannot follow a user that does not exist.");
    }

    let doesFollowAlreadyExist = await followCollection.findOne({
      followedId: this.followedId,
      authorId: new ObjectID(this.authorId),
    });
    if (action == "create") {
      if (doesFollowAlreadyExist) {
        this.errors.push("You are already following this user.");
      }
    }
    if (action == "delete") {
      if (!doesFollowAlreadyExist) {
        this.errors.push(
          "You cannot stop following someone you do not already follow."
        );
      }
    }

    // should not be able to follow yourself
    if (this.followedId.equals(this.authorId)) {
      this.errors.push("You cannot follow yourself.");
    }
  }
}

Follow.isVisitorFollowing = async (followedId, visitorId) => {
  let followDoc = await followCollection.findOne({
    followedId: followedId,
    authorId: new ObjectID(visitorId),
  });
  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

Follow.getFollowersById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followCollection
        .aggregate([
          { $match: { followedId: id } },
          {
            $lookup: {
              from: "users",
              localField: "authorId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] },
            },
          },
        ])
        .toArray();
      followers = followers.map(function (follower) {
        let user = new User(follower, true);
        return { username: follower.username, avatar: user.avatar };
      });
      resolve(followers);
    } catch {
      reject();
    }
  });
};

Follow.getFollowingById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followCollection
        .aggregate([
          { $match: { authorId: id } },
          {
            $lookup: {
              from: "users",
              localField: "followedId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] },
            },
          },
        ])
        .toArray();
      followers = followers.map(function (follower) {
        let user = new User(follower, true);
        return { username: follower.username, avatar: user.avatar };
      });
      resolve(followers);
    } catch {
      reject();
    }
  });
};

Follow.countFollowersById = (id) => {
  return new Promise(async (resolve, reject) => {
    let followerCount = await followCollection.countDocuments({
      followedId: id,
    });
    resolve(followerCount);
  });
};

Follow.countFollowingById = (id) => {
  return new Promise(async (resolve, reject) => {
    let count = await followCollection.countDocuments({ authorId: id });
    resolve(count);
  });
};
module.exports = Follow;

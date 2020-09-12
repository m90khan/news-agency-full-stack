const Post = require("../models/Post");

exports.viewCreateScreen = (req, res) => {
  res.render("create-post");
};

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then((newId) => {
      req.flash("success", "New post successfully created");
      req.session.save(() => {
        res.redirect(`/post/${newId}`);
      });
    })
    .catch((errors) => {
      errors.forEach((err) => {
        req.flash("errors", err);
      });
      req.session.save(() => {
        res.redirect("/create-post");
      });
    });
};

exports.viewSingle = async (req, res) => {
  try {
    /*
        let post = Post.findSingleById(req.params.id) // give the string styped after url/post/---
    - we want to look insid ethe database and return the post associated with 
    - the id. 
    - id is the user string associated with :i d 

    also, we do not want to get all the methods from the post but rather only the single method
    */
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post: post, title: post.title });
  } catch {
    res.render("404");
  }
};

exports.viewEditScreen = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id);
    if (post.authorId == req.visitorId) {
      res.render("edit-post", { post: post });
    } else {
      req.flash("errors", "You do not have permission to perform this action");
      req.session.save(() => res.redirect("/"));
    }
  } catch {
    res.render("404");
  }
};

exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then((status) => {
      // post is successfully updated in the database
      // OR user having permission , post have validation error
      if ((status = "success")) {
        // post updated in db

        req.flash("success", "Post successfully updated");
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      } else {
        post.errors.forEach((err) => {
          req.flash("errors", err);
        });
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`);
        });
      }
    })
    .catch(() => {
      //a post with requested id does not exists
      // or current visitor  is not the owner of the post
      req.flash(
        "errors",
        "You do not have the permission to perform this action"
      );
      req.session.save(() => {
        res.redirect("/");
      });
    });
};

exports.delete = (req, res) => {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash("success", "Post deleted Successfully");
      req.session.save(() => {
        res.redirect(`/profile/${req.session.user.username}`);
      });
    })
    .catch(() => {
      req.flash("errors", "No permission to delete the post");
      req.session.save(() => {
        res.redirect(`/`);
      });
    });
};

exports.search = (req, res) => {
  Post.search(req.body.searchTerm)
    .then((posts) => {
      res.json(posts);
    })
    .catch(() => {
      res.json([]);
    });
};

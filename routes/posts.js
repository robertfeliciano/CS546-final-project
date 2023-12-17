import {Router} from 'express';
const router = Router();
import {postsData, usersData} from '../data/index.js';
import * as validation from '../validation.js';
import {fromPostman} from "../helpers.js";
import xss from 'xss';


// ALL ROUTES REQUIRE USER TO BE LOGGED IN
// GET request / to see all posts
// GET request: /:id to see a specific post (edit button shows up if you own it!)
// PATCH request: /:id to like a post

// THESE ROUTES REQUIRE A USER TO OWN THE POST
// DELETE request: /:id to delete a specific post
// GET request: /:id/edit render the form to edit a post
// PATCH request: /:id/edit modify the rating/content of a post


router
  .route('/')
  .get(async (req, res) => {
    // GET / gets all posts
    try {
      // if (!req.session.user) res.render('/login');
      const posts = await postsData.getAllPosts();
      if (posts === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      if (fromPostman(req.headers['user-agent'])) return res.json({posts: posts});
      res.render('posts/all', {userInfo: req.session.user, posts: posts, subfeed: true, feedname: "Global Posts"});
    } catch (e) {
      res.status(404).json({error: e});
    }
  })

router
  .route('/:id')
  .get(async (req, res) => {
    // GET /:id gets a specific post

    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      const alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id);
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id);
      const postComments = await postsData.getCommentDetailsFromPost(req.params.id);
      if (alreadyLiked === undefined || ownPost === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (fromPostman(req.headers['user-agent']))
        return res.json( {userInfo: req.session.user,
          post: post,
          comments: postComments,
          ownPost: ownPost,
          alreadyLiked: alreadyLiked});

      res.render('posts/single', {userInfo: req.session.user,
        post: post,
        comments: postComments,
        ownPost: ownPost,
        alreadyLiked: alreadyLiked});
    } catch (e) {
      res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

  })

  .patch(async (req, res) => {
    // PATCH /:id likes a specific post (if it already hasn't been liked by the user)

    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
    let alreadyLiked;
    let ownPost;
    try {
      alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id)
      ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (alreadyLiked === undefined || ownPost === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
    } catch (e) {
      return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
    
    try {
      if (!alreadyLiked) {
        const post = await postsData.likePost(req.params.id, req.session.user._id);
        if (post === undefined)
          return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
        if (fromPostman(req.headers['user-agent'])) return res.json({post: post, ownPost: ownPost, alreadyLiked: true});
        // res.render('posts/single', {userInfo: req.session.user, post: post, ownPost: ownPost, alreadyLiked: true});
        return res.redirect(`/posts/${req.params.id}`);
      }
      else {
        return res.status(400).render("error/error",{userInfo: req.session.user, error: "Cannot like a post you already liked!", link:`/posts/${req.params.id}`});
      }
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).render("error/error",{userInfo: req.session.user, error: message, link:`/posts/`});
    }
    
  })

  .delete(async (req, res) => {
    // DELETE /:id deletes a specific post (only if the user owns it)

    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (ownPost === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (!ownPost) {
        return res.status(403).render("error/error",{userInfo: req.session.user, error: "You do not have permission to delete this post.", link:`/posts/`});
      }
    } catch (e) {
      return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

    try{
      const deletedPost = await postsData.removePost(req.params.id, req.session.user._id);
      if (deletedPost === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (fromPostman(req.headers['user-agent'])) return res.json({deleted: deletedPost});
      res.redirect('/posts');
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).render("error/error",{userInfo: req.session.user, error: message, link:`/posts/`});
    }
  });


router
  .route('/:id/edit')
  .get(async (req, res) => {
    // GET /:id/edit renders the form to edit a specific post (only if the user owns it)

    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (ownPost === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (!ownPost) {
        return res.status(403).render("error/error",{userInfo: req.session.user, error: "You do not have permission to edit this post.", link:`/posts/`});
      }
      const post = await postsData.getPostById(req.params.id);
      if (post === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (fromPostman(req.headers['user-agent'])) return res.json({post: post});

      res.render('posts/edit', {userInfo: req.session.user, post: post});
    } catch (e) {
      return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
  })


  .patch(async (req, res) => {
    // PATCH /:id/edit modifies the rating/content of a specific post (only if the user owns it)
    for (let key of Object.keys(req.body)) {
      req.body[key] = xss(req.body[key])
    }
    let {rating, content} = req.body;
    if (!rating)
      return res.status(400).render("error/error",{userInfo: req.session.user, error: 'must provide a rating!', link:`/posts/`});
    if (!content)
      return res.status(400).render("error/error",{userInfo: req.session.user, error: 'must provide post content!', link:`/posts/`});
    try {
      // if (!req.session.user) res.render('/login');
      // const user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      rating = validation.checkRating(rating, 'rating');
      content = validation.checkString(content, 'content');
    } catch (e) {
      return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

    let alreadyLiked;
    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id)
      if (ownPost === undefined || alreadyLiked === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (!ownPost) {
        return res.status(403).render("error/error",{userInfo: req.session.user, error: "You do not have permission to edit this post.", link:`/posts/`});
      }
    } catch (e) {
      return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

    try {
      const editedPost = await postsData.editPostContent(req.params.id, rating, content);
      if (editedPost === undefined)
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/posts/`});
      if (fromPostman(req.headers['user-agent']))
        return res.json({post: editedPost, ownPost: true, alreadyLiked: alreadyLiked});
      return res.redirect(`/posts/${req.params.id}`);
      // res.render('posts/single', {userInfo: req.session.user, post: editedPost, ownPost: true, alreadyLiked: alreadyLiked});
    }
    catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).render("error/error",{userInfo: req.session.user, error: message, link:`/posts/`});
    }
  });

export default router;
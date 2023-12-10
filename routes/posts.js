import {Router} from 'express';
const router = Router();
import {postsData, usersData} from '../data/index.js';
import * as validation from '../validation.js';


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
    // get all posts
    try {
      if (!req.session.user) res.render('/login');
      const posts = await postsData.getAllPosts();
      res.render('posts/all', {posts: posts});
    } catch (e) {
      res.status(500).json({error: e});
    }
  })

router
  .route('/:id')
  .get(async (req, res) => {
    let user_id
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      const user = await usersData.getUserById(user_id);
      let ownPost = false;
      for (const post of user.userPosts){
        if (post.equals(req.params.id)) {
          ownPost = true;
          break;
        }
      }
      if (ownPost) {
        //posts/manage is if you own the post you are accessing
        res.render('posts/manage', {post: post});
      }
      else {
        //posts/single is if you don't own the post you are accessing
        res.render('posts/single', {post: post});
      }
    } catch (e) {
      res.status(404).json({error: e});
    }
  })


  .patch(async (req, res) => {
    // like a post
    let user_id
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }

    try {
      //check if user hasn't already liked post before
      const temp = await postsData.getPostById(req.params.id);
      let alreadyLiked = false;
      for (const like of temp.likes) {
        if (like.equals(user_id)) {
          alreadyLiked = true;
        }
      }
      if (!alreadyLiked) {
        const post = await postsData.likePost(req.params.id, user_id);
        res.status(200).render('posts/single', {post: post});
      }
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  })


  .delete(async (req, res) => {
    let user_id
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const user = await usersData.getUserById(user_id);
      let ownPost = false;
      for (const post of user.userPosts){
        if (post.equals(req.params.id)) {
          ownPost = true;
          break;
        }
      }
      if (!ownPost) {
        res.status(403).json({error: 'You do not have permission to delete this post'});
      }
      let deletedPost = await postsData.removePost(req.params.id, user_id);
      res.status(200).json(deletedPost);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  });

router
  .route('/:id/edit')
  .get(async (req, res) => {
    let user_id
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const user = await usersData.getUserById(user_id);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
    let ownPost = false;
    for (const post of user.userPosts){
      if (post.equals(req.params.id)) {
        ownPost = true;
        break;
      }
    }
    if (!ownPost) {
      res.status(403).json({error: 'You do not have permission to edit this post'});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      res.render('posts/edit', {post: post});
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  })


  .patch(async (req, res) => {
    try {
      let {rating, content} = req.body;
      if (!req.session.user) res.render('/login');
      const user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      rating = validation.checkRating(rating, 'rating');
      content = validation.checkString(content, 'content');
      const user = await usersData.getUserById(user_id);
      let ownPost = false;
      for (const post of user.userPosts){
        if (post.equals(req.params.id)) {
          ownPost = true;
          break;
        }
      }
      if (!ownPost) {
        res.status(403).json({error: 'You do not have permission to edit this post'});
      }
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const editedPost = await postsData.updatePost(req.params.id, rating, content, user_id);
      res.render('posts/single', {post: editedPost})
    } catch (e) {
      return res.status(400).json({error: e});
    }
  });

export default router;

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
    // GET / gets all posts
    try {
      // if (!req.session.user) res.render('/login');
      const posts = await postsData.getAllPosts();
      if (posts === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      res.render('posts/all', {posts: posts});
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
      return res.status(400).json({error: e});
    }
    try {
      const alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id)
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (alreadyLiked === undefined || ownPost === undefined)
        return res.status(500).json({error: "Internal Server Error"});
        res.render('posts/single', {post: post, ownPost: ownPost, alreadyLiked: alreadyLiked});
    } catch (e) {
      res.status(404).json({error: e});
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
      return res.status(400).json({error: e});
    }
    let alreadyLiked;
    let ownPost;
    try {
      alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id)
      ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (alreadyLiked === undefined || ownPost === undefined)
        return res.status(500).json({error: "Internal Server Error"});
    } catch (e) {
      return res.status(404).json({error: e});
    }
    
    try {
      if (!alreadyLiked) {
        const post = await postsData.likePost(req.params.id, req.session.user._id);
        if (post === undefined)
          return res.status(500).json({error: "Internal Server Error"});
        res.render('posts/single', {post: post, ownPost: ownPost, alreadyLiked: true});
      }
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
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
      return res.status(400).json({error: e});
    }
    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (ownPost === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      if (!ownPost) {
        res.status(403).json({error: 'You do not have permission to delete this post'});
      }
    } catch (e) {
      return res.status(404).json({error: e});
    }

    try{
      const deletedPost = await postsData.removePost(req.params.id, req.session.user._id);
      if (deletedPost === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      res.redirect('/posts');
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
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
      return res.status(400).json({error: e});
    }    

    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (ownPost === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      if (!ownPost) {
        res.status(403).json({error: 'You do not have permission to edit this post'});
      }
      const post = await postsData.getPostById(req.params.id);
      if (post === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      res.render('posts/edit', {post: post});
    } catch (e) {
      return res.status(404).json({error: e});
    }
  })


  .patch(async (req, res) => {
    // PATCH /:id/edit modifies the rating/content of a specific post (only if the user owns it)
    
    try {
      let {rating, content} = req.body;
      // if (!req.session.user) res.render('/login');
      // const user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      rating = validation.checkRating(rating, 'rating');
      content = validation.checkString(content, 'content');     
    } catch (e) {
      return res.status(400).json({error: e});
    }

    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      const alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id)
      if (ownPost === undefined || alreadyLiked === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      if (!ownPost) {
        res.status(403).json({error: 'You do not have permission to edit this post'});
      }
    } catch (e) {
      return res.status(404).json({error: e});
    }

    try {
      const editedPost = await postsData.editPostContent(req.params.id, rating, content);
      if (editedPost === undefined)
        return res.status(500).json({error: "Internal Server Error"});
      
      res.render('posts/single', {post: editedPost, ownPost: true, alreadyLiked: alreadyLiked});
    }
    catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  });

export default router;
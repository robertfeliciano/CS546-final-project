import {Router} from 'express';
const router = Router();
import {postsData} from '../data/index.js';
import validation from '../validation.js';


// under music: /music/:id GET request to see all posts under a song ---- /music/:id POST request to create a new post under a song
// GET request: /posts/:id to see a specific post
// DELETE request: /posts/:id to delete a specific post
// PATCH request: /posts/:id to like a post
// GET request /posts/:id/edit render the form to edit a post -> then PATCH request with the data that needs to be edited (content of post)
// GET request /posts to see all posts from friends

router
  .route('/music/:id')
  .get(async (req, res) => {
    // GET / gets all posts
    try {
      req.params.id = validation.checkId(req.params.id, 'music id');
      const postList = await postsData.getAll(req.params.id);
      res.render('posts/index', {posts: postList});
    } catch (e) {
      res.status(500).json({error: e});
    }
  })
  .post(async (req, res) => {
    const {song_id, rating, user_id, content} = req.body;
    let errors = [];
    if (!song_id) throw 'You must provide a song id';
    try {
      req.params.id = 
      const date = new Date();
      const newPost = await postsData.createPost(song_id, rating, user_id, content, date, 0);
      res.redirect(`/posts/${newPost._id}`);
    } catch (e) {
      res.status(500).json({error: e});
    }
  })

router
  .route('/posts/:id')
  .get(async (req, res) => {
    // GET /:id gets a specific post

    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).render("error",{error: e, link:`/posts/`});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      const alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id);
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id);
      if (alreadyLiked === undefined || ownPost === undefined)
        return res.status(500).render("error",{error: "Internal Server Error", link:`/posts/`});
      if (fromPostman(req.headers['user-agent'])) return res.json( {post: post, ownPost: ownPost, alreadyLiked: alreadyLiked});
      res.render('posts/single', {post: post, ownPost: ownPost, alreadyLiked: alreadyLiked});
    } catch (e) {
      res.status(404).render("error",{error: e, link:`/posts/`});
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
      return res.status(400).render("error",{error: e, link:`/posts/`});
    }
    let alreadyLiked;
    let ownPost;
    try {
      alreadyLiked = await usersData.alreadyLikedPost(req.session.user._id, req.params.id)
      ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (alreadyLiked === undefined || ownPost === undefined)
        return res.status(500).render("error",{error: "Internal Server Error", link:`/posts/`});
    } catch (e) {
      return res.status(404).render("error",{error: e, link:`/posts/`});
    }
    
    try {
      if (!alreadyLiked) {
        const post = await postsData.likePost(req.params.id, req.session.user._id);
        if (post === undefined)
          return res.status(500).render("error",{error: "Internal Server Error", link:`/posts/`});
        if (fromPostman(req.headers['user-agent'])) return res.json({post: post, ownPost: ownPost, alreadyLiked: true});
        res.render('posts/single', {post: post, ownPost: ownPost, alreadyLiked: true});
      }
      else {
        return res.status(400).render("error",{error: "Cannot like a post you already liked!", link:`/posts/${req.params.id}`});
      }
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).render("error",{error: message, link:`/posts/`});
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
      return res.status(400).render("error",{error: e, link:`/posts/`});
    }
    try {
      const ownPost = await usersData.userOwnsPost(req.session.user._id, req.params.id)
      if (ownPost === undefined)
        return res.status(500).render("error",{error: "Internal Server Error", link:`/posts/`});
      if (!ownPost) {
        return res.status(403).render("error",{error: "You do not have permission to delete this post.", link:`/posts/`});
      }
    } catch (e) {
      return res.status(404).render("error",{error: e, link:`/posts/`});
    }

    try{
      const deletedPost = await postsData.removePost(req.params.id, req.session.user._id);
      if (deletedPost === undefined)
        return res.status(500).render("error",{error: "Internal Server Error", link:`/posts/`});
      if (fromPostman(req.headers['user-agent'])) return res.json({deleted: deletedPost});
      res.redirect('/posts');
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).render("error",{error: message, link:`/posts/`});
    }
  });

export default router;

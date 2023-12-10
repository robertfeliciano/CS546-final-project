import {Router} from 'express';
const router = Router();
import {postsData, usersData} from '../data/index.js';
import validation from '../validation.js';


// under music: /music/:id GET request to see all posts under a song ---- /music/:id POST request to create a new post under a song
// GET request: /posts/:id to see a specific post
// DELETE request: /posts/:id to delete a specific post
// PATCH request: /posts/:id to like a post
// GET request /posts/:id/edit render the form to edit a post -> then PATCH request with the data that needs to be edited (content of post)
// GET request /posts to see all posts from friends


router
  .route('/posts')
  .get(async (req, res) => {
    try {
      if (!req.session.user) res.render('/login');
      let user_id = req.session.user._id;
      const postList = await postsData.getAllFriendPosts(user_id);
      res.render('posts/index', {posts: postList});
    } catch (e) {
      res.status(500).json({error: e});
    }
  })

router
  .route('/music/:id')
  .get(async (req, res) => {
    try {
      if (!req.session.user) res.render('/login');
      let user_id = req.session.user._id;
      req.params.id = validation.checkId(req.params.id, 'music id');
      const postList = await postsData.getAll(req.params.id);
      res.render('posts/index', {posts: postList});
    } catch (e) {
      res.status(500).json({error: e});
    }
  })
  .post(async (req, res) => {
    if (!req.session.user) res.render('/login');

    const {rating, content} = req.body;
    const user_id = req.session.user._id;
    if (!rating) {
      res.status(400).json({error: 'You must provide a rating'});
      return;
    }
    if (!content) {
      res.status(400).json({error: 'You must provide content'});
      return;
    }
    try {
      const song_id = validation.checkId(req.params.id, 'music id');
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
    try {
      if (!req.session.user) res.render('/login');
      const user_id = req.session.user._id;
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      if (usersData.checkIfOwnPost(req.params.id, user_id)) {
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
    try {
      if (!req.session.user) res.render('/login');
      const user_id = req.session.user._id;
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      //check if user hasn't already liked post before
      const temp = await postsData.getPostById(req.params.id);
      if (!temp.likes.includes(user_id)) {
        const post = await postsData.likePost(req.params.id, user_id);
        res.status(200).render('posts/single', {post: post});
      }
    } catch (e) {
      return res.status(400).json({error: e});
    }
  })
  .delete(async (req, res) => {
    try {
      if (!req.session.user) res.render('/login');
      const user_id = req.session.user._id;
      req.params.id = validation.checkId(req.params.id, 'Post ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      let deletedPost = await postsData.removePost(req.params.id, user_id);
      res.status(200).json(deletedPost);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  });

router
  .route('/posts/:id/edit')
  .get(async (req, res) => {
    try {
      if (!req.session.user) res.render('/login');
      const user_id = req.session.user._id;
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      if (!usersData.checkIfOwnPost(req.params.id, user_id)){
        res.status(403).json({error: 'You do not have permission to edit this post'});
      }
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      res.render('posts/edit', {post: post});
    } catch (e) {
      res.status(404).json({error: e});
    }
  })
  .patch(async (req, res) => {
    let {content} = req.body;
    if (!req.session.user) res.render('/login');
    const user_id = req.session.user._id;
    if (!usersData.checkIfOwnPost(req.params.id, user_id)){
      res.status(403).json({error: 'You do not have permission to edit this post'});
    }
    try {
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      content = validation.checkString(content, 'content');
      const editedPost = await postsData.updatePost(req.params.id, content, user_id);
      res.render('posts/single', {post: editedPost})
    } catch (e) {
      return res.status(400).json({error: e});
    }
  });

export default router;

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
    try {
      req.params.id = validation.checkId(req.params.id, 'Id URL Param');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const post = await postsData.getPostById(req.params.id);
      res.render('posts/single', {post: post});
    } catch (e) {
      res.status(404).json({error: e});
    }
  })
  .put(async (req, res) => {
    const updatedData = req.body;
    try {
      req.params.id = validation.checkId(req.params.id, 'ID url param');
      updatedData.title = validation.checkString(updatedData.title, 'Title');
      updatedData.body = validation.checkString(updatedData.body, 'Body');
      updatedData.posterId = validation.checkId(
        updatedData.posterId,
        'Poster ID'
      );
      if (updatedData.tags) {
        if (!Array.isArray(updatedData.tags)) {
          updatedData.tags = [];
        } else {
          updatedData.tags = validation.checkStringArray(
            updatedData.tags,
            'Tags'
          );
        }
      }
    } catch (e) {
      return res.status(400).json({error: e});
    }

    try {
      const updatedPost = await postsData.updatePostPut(
        req.params.id,
        updatedData
      );
      res.json(updatedPost);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  })
  .patch(async (req, res) => {
    const requestBody = req.body;
    try {
      req.params.id = validation.checkId(req.params.id, 'Post ID');
      if (requestBody.title)
        requestBody.title = validation.checkString(requestBody.title, 'Title');
      if (requestBody.body)
        requestBody.body = validation.checkString(requestBody.body, 'Body');
      if (requestBody.posterId)
        requestBody.posterId = validation.checkId(
          requestBody.posterId,
          'Poster ID'
        );
      if (requestBody.tags)
        requestBody.tags = validation.checkStringArray(
          requestBody.tags,
          'Tags'
        );
    } catch (e) {
      return res.status(400).json({error: e});
    }

    try {
      const updatedPost = await postsData.updatePostPatch(
        req.params.id,
        requestBody
      );
      res.json(updatedPost);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  })
  .delete(async (req, res) => {
    try {
      req.params.id = validation.checkId(req.params.id, 'Id URL Param');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      let deletedPost = await postsData.removePost(req.params.id);
      res.status(200).json(deletedPost);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).json({error: message});
    }
  });

export default router;
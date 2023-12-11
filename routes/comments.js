import {Router} from 'express';
const router = Router();
import { commentsData, usersData } from '../data/index.js';
import * as validation from '../validation.js';


// ALL ROUTES REQUIRE USER TO BE LOGGED IN
// POST request /:post_id to create a comment on a post
// DELETE request: /post_id/:id to delete a specific comment

// THESE ROUTES REQUIRE A USER TO OWN THE COMMENT



router
  .route('/:post_id')
  .post(async (req, res) => {
    // create a comment on a post
    let user_id;
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.post_id = validation.checkId(req.params.post_id, 'Post ID');
      req.body.content = validation.checkString(req.body.content, 'Comment Content');
      if (req.body.content.length > 150) throw `Comment must be less than 150 characters!`;
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const comment = await commentsData.createComment(req.params.post_id, user_id, req.body.content, new Date());
      res.redirect(`/posts/${req.params.post_id}`);
    } catch (e) {
      res.status(500).json({error: e});
    }
  });

router
  .route('/:post_id/:id')
  .delete(async (req, res) => {
    // delete a comment
    let user_id;
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.post_id = validation.checkId(req.params.post_id, 'Post ID');
      req.params.id = validation.checkId(req.params.id, 'Comment ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const comment = await commentsData.getCommentById(req.params.id);
      if (!comment.user_id.equals(user_id)) {
        throw `User ${user_id} does not own comment ${req.params.id}`;
      }
      await commentsData.deleteComment(req.params.id);
      res.redirect(`/posts/${req.params.post_id}`);
    } catch (e) {
      res.status(500).json({error: e});
    }
  });
import {Router} from 'express';
const router = Router();
import {commentsData, postsData} from '../data/index.js';
import * as validation from '../validation.js';
import xss from 'xss';
import {fromPostman} from "../helpers.js";


// ALL ROUTES REQUIRE USER TO BE LOGGED IN
// POST request /:post_id to create a comment on a post
// DELETE request: /post_id/:id to delete a specific comment

// THESE ROUTES REQUIRE A USER TO OWN THE COMMENT



router
  .route('/:id')
  .post(async (req, res) => {
    // POST /comments/:id creates a comment on a post
    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'Post ID');

      req.body.content = validation.checkString(xss(req.body.content), 'Comment Content');
    } catch (e) {
      return res.status(400).render("error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
    try {
      const alreadyCommented = await commentsData.userAlreadyCommented(req.params.id, req.session.user._id);
      if (alreadyCommented)
        throw [409, `User ${req.session.user._id} has already commented under ${req.params.id}`];
    } catch(e) {
      return res.status(e[0]).render('error', {userInfo: req.session.user, error: e[1], link: `/posts/${req.params.id}`});
    }
    try {
      const comment = await commentsData.createComment(req.params.id, req.session.user._id, req.body.content, new Date());
      if (comment === undefined)
        return res.status(500).render("error",{userInfo: req.session.user, error: "Internal Service Error", link:`/posts/${req.params.id}`});
      // redirect to GET /comments/:new_comment_id to view the comment you made
      res.redirect(`/comments/${comment._id}`);
    } catch (e) {
      res.status(500).render("error",{userInfo: req.session.user, error: e, link:`/posts/${req.params.id}`});
    }
  })
  .get(async (req, res) => {
    // GET /comments/:id gets a comment
    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');

      req.params.id = validation.checkId(req.params.id, 'Comment ID');
    } catch (e) {
      return res.status(400).render("error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

    try {
      const comment = await commentsData.getCommentById(req.params.id);
      if (comment === undefined)
        return res.status(500).render("error",{userInfo: req.session.user, error: "Internal Service Error", link:`/posts/`});

      const commenterId = comment.user_id;
      const user_id = req.session.user._id;
      let ownComment = commenterId.equals(user_id);
      if (fromPostman(req.headers['user-agent']))
        return res.json({comment: comment, ownComment: ownComment})
      res.render('comments/single', {userInfo: req.session.user, comment: comment, ownComment: ownComment});

    } catch (e) {
      // only error caught would be if db cant find comment
      res.status(404).render("error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
  })
  .delete(async (req, res) => {
    // DELETE /comments/:id deletes a comment
    // let user_id;
    try {
      // if (!req.session.user) res.render('/login');
      // user_id = validation.checkId(req.session.user._id, 'User ID');

      req.params.id = validation.checkId(req.params.id, 'Comment ID');
    } catch (e) {
      return res.status(400).render("error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }

    try {
      const comment = await commentsData.getCommentById(req.params.id);
      if (comment === undefined)
        return res.status(500).render("error",{userInfo: req.session.user, error: "Internal Service Error", link:`/posts/`});

      const commenterId = comment.user_id;
      const user_id = req.session.user._id;
      let ownComment = commenterId.equals(user_id);
      if (!ownComment) {
        return res.status(400).render("error",{userInfo: req.session.user, error: 'Only comment owner can delete a comment', link:`/posts/`});
      }
      const post_id = comment.post_id;
      await commentsData.removeComment(req.params.id, user_id);
      res.redirect(`/posts/${post_id}`);

    } catch (e) {
      if (Array.isArray(e)) // when removeComment throws
        res.status(e[0]).render("error",{userInfo: req.session.user, error: e[1], link:`/posts/`});

      // when getCommentById throws
      res.status(500).render("error",{userInfo: req.session.user, error: e, link:`/posts/`});
    }
  });

export default router;
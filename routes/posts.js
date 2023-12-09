import {Router} from 'express';
const router = Router();
import {postsData, usersData} from '../data/index.js';
import validation from '../validation.js';

router.route('/new').get(async (req, res) => {
  const users = await usersData.getAllUsers();
  res.render('posts/new', {users: users});
});
router
  .route('/')
  .get(async (req, res) => {
    try {
      const postList = await postsData.getAll();
      res.render('posts/index', {posts: postList});
    } catch (e) {
      res.status(500).json({error: e});
    }
  })
  .post(async (req, res) => {
    const {song_id, rating, user_id, content} = req.body;
    let errors = [];
    if (!song_id)
    try {
      const date = new Date();
      const newPost = await postsData.createPost(song_id, rating, user_id, content, date, 0);
      res.redirect(`/posts/${newPost._id}`);
    } catch (e) {
      res.status(500).json({error: e});
    }
  })
  .put(async (req, res) => {
    res.send('ROUTED TO PUT ROUTE');
  });

router
  .route('/:id')
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

router.route('/tag/:tag').get(async (req, res) => {
  try {
    req.params.tag = validation.checkString(req.params.tag, 'Tag');
  } catch (e) {
    return res.status(400).json({error: e});
  }
  try {
    const postList = await postsData.getPostsByTag(req.params.tag);
    res.render('posts/index', {posts: postList});
  } catch (e) {
    res.status(400).json({error: e});
  }
});

router.route('/tag/rename').patch(async (req, res) => {
  try {
    req.body.oldTag = validation.checkString(req.body.oldTag, 'Old Tag');
    req.body.newTag = validation.checkString(req.body.newTag, 'New Tag');
  } catch (e) {
    res.status(400).json({error: e});
  }

  try {
    let getNewTagPosts = await postsData.renameTag(
      req.body.oldTag,
      req.body.newTag
    );
    res.json(getNewTagPosts);
  } catch (e) {
    let status = e[0];
    let message = e[1];
    res.status(status).json({error: message});
  }
});

export default router;
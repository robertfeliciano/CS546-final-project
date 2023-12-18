import {Router} from 'express';
import * as val  from '../validation.js';
import {postsData} from '../data/index.js'
import {fromPostman} from "../helpers.js";
import {ObjectId} from "mongodb";

const router = Router();


router
    .route('/')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
        // req.session.user = {_id: '65778e7ebfbd20eee0371d87'};
        try {
            let following_posts = await postsData.getAllPostsFromFollowing(
                req.session.user._id
            );
            // SORT BASED ON DATE-TIME OF POST, MOST RECENT COMES FIRST
            following_posts = following_posts.sort((a, b) => b.date.getTime() - a.date.getTime());
            if (fromPostman(req.headers['user-agent']))
                return res.json({userInfo: req.session.user, posts: following_posts});
            else
                return res.render('posts/all', {
                  userInfo: req.session.user,
                  posts: following_posts,
                  subfeed: true,
                  feedname: 'Home'});
        } catch(e) {
            return res.status(500).json({error: "Internal Server Error", problem: e});
        }
    });


export default router;
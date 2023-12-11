import {Router} from 'express';
import * as val  from '../validation.js';
import {postsData} from '../data/index.js'
import {fromPostman} from "../helpers.js";

const router = Router();


router
    .route('/')
    .get(async (req, res) => {
        try {
            const following_posts = await postsData.getAllPostsFromFollowing(
                req.session.user._id
            );
            // TODO SORT BASED ON DATE-TIME OF POST, MOST RECENT COMES FIRST
            if (fromPostman(req.headers['user-agent']))
                return res.json({posts: following_posts});
            else
                return res.render('home', req.session.user);
        } catch(e) {
            return res.status(500).json({error: "Internal Server Error", problem: e});
        }
    });


export default router;
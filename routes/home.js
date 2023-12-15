import {Router} from 'express';
import * as val  from '../validation.js';
import {postsData} from '../data/index.js'
import {fromPostman} from "../helpers.js";
import {ObjectId} from "mongodb";

const router = Router();


router
    .route('/')
    .get(async (req, res) => {
        // req.session.user = {_id: '65778e7ebfbd20eee0371d87'};
        try {
            let following_posts = await postsData.getAllPostsFromFollowing(
                req.session.user._id
            );
            // SORT BASED ON DATE-TIME OF POST, MOST RECENT COMES FIRST
            following_posts = following_posts.sort((a, b) => b.date.getTime() - a.date.getTime());
            if (fromPostman(req.headers['user-agent']))
                return res.json({posts: following_posts});
            else
                //render temp html
                // return res.render('<h1>hello</h1>');
                
                return res.render('posts/all', req.session.user);
        } catch(e) {
            return res.status(500).json({error: "Internal Server Error", problem: e});
        }
    });


export default router;
import {Router} from 'express';
import {usersData} from '../data/index.js';
import * as validation  from '../validation.js';
import {fromPostman} from "../helpers.js";

const router = Router();

router
    .route('/search')
    .get(async (req, res) => {
        //code here for GET
        let query = req.query.user;
        /**
         * TODO: FRONT END TEAM
         * upon submitting something a search bar,
         * the action should be
         * /users/search?user=someusername
         * and the method should be GET
         */
        try {
            // if (!req.session.user) res.render('/login');
            query = validation.checkName(query, 'Search Query');
        } catch (e) {
            return res.status(400).json({error: e});
        }
        try {
            const users = await usersData.fuzzyFindUser(query);

            if (users === undefined)
                return res.status(500).json({error: "Internal Server Error"});

            const isEmpty = users.length === 0;
            if (fromPostman(req.headers['user-agent']))
              res.json({users: users});
            return res.render('users/search', {users: users, empty: isEmpty});
        } catch(e){
            return res.status(404).json({error: e})
        }
    });

router
    .route('/:id')
    .get(async (req, res) => {
        // let user_id;
        try {
          // if (!req.session.user) res.render('/login');
          // user_id = validation.checkId(req.session.user._id, 'User ID');
          req.params.id = validation.checkId(req.params.id, 'User Page ID');
        } catch (e) {
          return res.status(400).json({error: e});
        }

        try {
          const user = await usersData.getUserById(req.params.id);
          const userPosts = await usersData.getPostsFromUserId(req.params.id);
          const likedPosts = await usersData.getLikedPostsFromUserId(req.params.id);
          let curr_user_id = req.session.user._id;
          let owner = curr_user_id.equals(req.params.id);
          if (fromPostman(req.headers['user-agent']))
            return res.json({user: user, posts: userPosts, likes: likedPosts, owner: owner});
          // TODO pass in whether or not current user follows the user by :id
          // this determines whether or not to render a follow button
          // if they are NOT the same user and they DO NOT follow:
          // display follow button
          // if they are NOT the same user and they DO follow:
          // display UNfollow button
          res.render('users/single', {user: user, posts: userPosts, likes: likedPosts, owner: owner})
        } catch (e) {
          res.status(404).json({error: e});
        }
    })
    .delete(async (req, res) => {
        //code here for DELETE
        try {
            // if (!req.session.user) res.render('/login');
            // user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID');
        } catch (e) {
            return res.status(400).json({error: e});
        }
        let curr_user_id = req.session.user._id;

        try {
            if (!curr_user_id.equals(req.params.id)) {
                return res.status(400).json({error: `User ${req.session.user._id} does not own user ${req.params.id}'s profile`});
            }

            let removed = await usersData.removeUser(req.params.id);
            if (!removed)
                return res.status(500).json({error: 'Internal Server Error'});

            if (fromPostman(req.headers['user-agent']))
              return res.json({deleted: removed});

            return res.redirect('/register');
        } catch (e) {
            // e is always an array after removing user
            return res.status(e[0]).json({error: e[1]});
        }
    });

router.route('/:id/followers').get(async (req, res) => {
    //code here for GET
    try {
        // if (!req.session.user) res.render('/login');
        req.params.id = validation.checkId(req.params.id, 'User ID');
    } catch (e) {
        return res.status(400).json({error: e});
    }

    try {
        const followerList = await usersData.getFollowing(req.params.id);
        if (fromPostman(req.headers['user-agent']))
          return res.json({followers: followerList});
        return res.render('users/followers', {users: followerList});
    } catch(e) {
        return res.status(404).json({error: e});
    }
});

router.route('/:id/following').get(async (req, res) => {
    //code here for GET
    try {
        // if (!req.session.user) res.render('/login');
        req.params.id = validation.checkId(req.params.id, 'User ID');
    } catch (e) {
        return res.status(400).json({error: e});
    }
    try {
        const followingList = await usersData.getFollowing(req.params.id);
        if (fromPostman(req.headers['user-agent']))
          return res.json({following: followingList});
        return res.render('users/following', {users: followingList});
    } catch(e) {
        return res.status(404).json({error: e});
    }
});

router
    .route('/:id/edit')
    .get(async (req, res) => {
        //code here for GET
        try {
            // if (!req.session.user) res.render('/login');
            // user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID');
        } catch (e) {
            return res.status(400).json({error: e});
        }
        try {
            const user_id = req.session.user._id;
            if (!user_id.equals(req.params.id)){
                return res.status(403).json({error: `User${user_id} does not own ${req.params.id}'s profile.`});
            }
            const user = await usersData.getUserById(req.params.id);
            if (fromPostman(req.headers['user-agent']))
              return res.json({user:user});
            return res.render('users/edit', {user: user});
        } catch(e) {
            return res.status(404).json({error: e});
        }
    })
    .patch(async (req, res) => {
        //code here for PATCH
        try {
            // if (!req.session.user) res.render('/login');
            // let user_id = validation.checkId(req.session.user._id, 'User ID');
            //TODO need to put xss in users routes
            req.params.id = validation.checkId(req.params.id, 'User Page ID');
            req.body.userBio = validation.checkBio(req.body.userBio);
            const curr_user_id = req.session.user._id;
            if (!curr_user_id.equals(req.params.id)){
                return res.status(403).json({error: `User ${req.session.user._id} does not own user ${req.params.id}`});
            }
        } catch (e) {
            return res.status(400).json({error: e});
        }
        try {
            const updatedUser = await usersData.updateUserBio(req.params.id, req.body.userBio);
            if (fromPostman(req.headers['user-agent']))
              return res.json({user: updatedUser, owner: true});
            // TODO maybe redirect to /users/:id instead of just rendering....
            return res.render('users/single', {user: updatedUser, owner: true});
        } catch(e) {
            return res.status(404).json({error: e});
        }
    });

router
    .route('/:id/follow')
    .patch(async (req, res) => {
        //code here for PATCH
        try {
            // if (!req.session.user) res.render('/login');
            req.params.id = validation.checkId(req.params.id, 'User ID');
            let curr_user_id = req.session.user._id;

            if (curr_user_id.equals(req.params.id)){
                return res.status(400).json({error: `User ${req.session.user._id} cannot follow themselves`});
            }
        } catch (e) {
            return res.status(400).json({error: e});
        }
        try {
            const updatedUser = await usersData.addFollower(req.params.id, req.session.user._id);

            req.session.user.following = await usersData.getFollowing(req.session.user._id);

            if (fromPostman(req.headers['user-agent']))
              return res.json({user: updatedUser, following: req.session.user.following})

            return res.redirect(`/users/${req.params.id}`);
        } catch(e) {
            console.log(e);
            return res.status(e[0]).json({error: e[1]});
        }
    });

router
    .route('/:id/unfollow')
    .patch(async (req, res) => {
        //code here for PATCH
        try {
            // if (!req.session.user) res.render('/login');
            // user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID')
            let curr_user_id = req.session.user._id;

            if (curr_user_id.equals(req.params.id)){
                return res.status(400).json({error: `User ${req.session.user._id} cannot unfollow themselves`});
            }
        } catch (e) {
            return res.status(400).json({error: e});
        }
        try {
            const updatedUser= await usersData.removeFollower(req.params.id, req.session.user._id);

            req.session.user.following = await usersData.getFollowing(req.session.user._id);

            if (fromPostman(req.headers['user-agent']))
              return res.json({user: updatedUser, following: req.session.user.following})

            return res.redirect(`/users/${req.params.id}`);
        } catch(e) {
            console.log(e);
            return res.status(e[0]).json({error: e[1]});
        }
    });


export default router;
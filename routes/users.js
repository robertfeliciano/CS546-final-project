import {Router} from 'express';
import {usersData} from '../data/index.js';
import * as validation  from '../validation.js';

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
          let curr_user_id = req.session.user._id;
          let owner = curr_user_id.equals(req.params.id);
          res.render('users/single', {user: user, owner: owner})
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
        const user = await usersData.getUserById(req.params.id);
        const followers = user.followers;
        let followerList = [];
        for (const follower of followers) {
            const followerUser = await usersData.getUserById(follower);
            followerList.push(followerUser);
        }

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
        const user = await usersData.getUserById(req.params.id);
        const following = user.following;
        let followingList = [];
        for (const follow of following) {
            const followingUser = await usersData.getUserById(follow);
            followingList.push(followingUser);
        }
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
            req.session.user.following.push(req.params.id);
            return res.render(`/users/${req.params.id}`);
        } catch(e) {
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
            const index_of_user_to_unfollow = req.session.user.following.indexOf(req.params.id)
            req.session.user.following.splice(index_of_user_to_unfollow, 1);
            const updatedUser= await usersData.removeFollower(req.params.id, req.session.user._id);
            return res.render(`/users/${req.params.id}`);
        } catch(e) {
            return res.status(e[0]).json({error: e[1]});
        }
    });


export default router;
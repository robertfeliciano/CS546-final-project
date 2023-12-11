import {Router} from 'express';
import {usersData} from '../data/index.js';
import * as validation  from '../validation.js';

// GET / -> not a thing; dont want to get all users
// GET /search/?query
// Fuzzy search user db to find user with username query
// Pretty much same handlebar as GET /music/search/?query
// Just shows resulting profiles that u can click on
// GET /:id
// Shows page for a user
// Same as GET /post/:id -> if u own it, show edit (action: GET /users/:id/edit) and delete button (action DELETE /users/:id)
// Has follow button if u are not the same user and dont follow them yet otherwise UNFOLLOW button
// This COULD be an AJAX thing Tyler Soiferman Lennon Okun
// Links to get followers and following lists
// GET /:id/followers and GET/:id/following
// Just a list of users, similar to handlebars for GET /music/search/?query
// PATCH /follow/:id
// Follow a user if your id doesnt match url id
// GET /:id/edit
// Renders the edit form for a profile
// New handlebar just for this
// PATCH /:id/edit
// This is the request that the edit form submits
// Action on submit form above is PATCH /:id/edit
// DELETE /:id
// delete the user if they are logged in and their id matches the url id



const router = Router();

router.route('/search').get(async (req, res) => {
    //code here for GET
    try {
        if (!req.session.user) res.render('/login');
        let query = req.query.piece;
        query = validation.checkString(query, 'Search Query');
        const users = await usersData.getUserByName(query);
        return res.render('users/search', {users: users});
    } catch (e) {
        return res.status(400).json({error: e});
    }
    
});

router.route('/:id').get(async (req, res) => {
    let user_id;
    try {
      if (!req.session.user) res.render('/login');
      user_id = validation.checkId(req.session.user._id, 'User ID');
      req.params.id = validation.checkId(req.params.id, 'User Page ID');
    } catch (e) {
      return res.status(400).json({error: e});
    }
    try {
      const user = await usersData.getUserById(req.params.id);
      if (user_id.equals(req.params.id)) {
        res.render('users/manage', {user: user});
      }
      else {
        res.render('users/single', {user: user});
      }

    } catch (e) {
      res.status(404).json({error: e});
    }
})
.delete(async (req, res) => {
    //code here for DELETE
    try {
        if (!req.session.user) res.render('/login');
        user_id = validation.checkId(req.session.user._id, 'User ID');
        req.params.id = validation.checkId(req.params.id, 'User Page ID');
        if (!user_id.equals(req.params.id)){
            throw `User ${req.session.user._id} does not own user ${req.params.id}`;
        }
        await usersData.deleteUser(req.params.id);
        return res.redirect('/register');
    } catch (e) {
        return res.status(400).json({error: e});
    }
});

router.route('/:id/followers').get(async (req, res) => {
    //code here for GET
    try {
        if (!req.session.user) res.render('/login');
        req.params.id = validation.checkId(req.params.id, 'User ID');
        const user = await usersData.getUserById(req.params.id);
        const followers = user.followers;
        const followerList = [];
        for (const follower of followers) {
            const followerUser = await usersData.getUserById(follower);
            followerList.push(followerUser);
        }
        return res.render('users/followers', {users: followerList});
    } catch (e) {
        return res.status(400).json({error: e});
    }
});

router.route('/:id/following').get(async (req, res) => {
    //code here for GET
    try {
        if (!req.session.user) res.render('/login');
        req.params.id = validation.checkId(req.params.id, 'User ID');
        const user = await usersData.getUserById(req.params.id);
        const following = user.following;
        const followingList = [];
        for (const follow of following) {
            const followingUser = await usersData.getUserById(follow);
            followingList.push(followingUser);
        }
        return res.render('users/following', {users: followingList});
    } catch (e) {
        return res.status(400).json({error: e});
    }
});

router.route('/:id/edit').get(async (req, res) => {
    //code here for GET
    try {
        if (!req.session.user) res.render('/login');
        user_id = validation.checkId(req.session.user._id, 'User ID');
        req.params.id = validation.checkId(req.params.id, 'User Page ID');
        if (!user_id.equals(req.params.id)){
            throw `User ${req.session.user._id} does not own user ${req.params.id}`;
        }
        const user = await usersData.getUserById(req.params.id);
        return res.render('users/edit', {user: user});
    } catch (e) {
        return res.status(400).json({error: e});
    }
})
.patch(async (req, res) => {
    //code here for PATCH
    try {
        if (!req.session.user) res.render('/login');
        user_id = validation.checkId(req.session.user._id, 'User ID');
        req.params.id = validation.checkId(req.params.id, 'User Page ID');
        req.body.userBio = validation.checkString(req.body.userBio, 'User Bio');
        if (!user_id.equals(req.params.id)){
            throw `User ${req.session.user._id} does not own user ${req.params.id}`;
        }
        const user = await usersData.getUserById(req.params.id);
        const updatedUser = await usersData.updateUserPatch(req.params.id, req.body.userBio);
        return res.render('users/manage', {user: updatedUser});
    } catch (e) {
        return res.status(400).json({error: e});
    }
});

router.route('/follow/:id').patch(async (req, res) => {
    //code here for PATCH
    try {
        if (!req.session.user) res.render('/login');
        user_id = validation.checkId(req.session.user._id, 'User ID');
        req.params.id = validation.checkId(req.params.id, 'User Page ID');
        if (user_id.equals(req.params.id)){
            throw `User ${req.session.user._id} cannot follow themselves`;
        }
        const user = await usersData.getUserById(req.params.id);
        //check if user is already following
        for (const follower of user.followers) {
            if (follower.equals(user_id)) {
                throw `User ${user_id} already follows user ${req.params.id}`;
            }
        }
        const updatedUser = await usersData.updateFollowers(req.params.id, user_id);
        return res.render(`/users/${req.params.id}`);
    } catch (e) {
        return res.status(400).json({error: e});
    }
});

router.route('/unfollow/:id').patch(async (req, res) => {
    //code here for PATCH
    try {
        if (!req.session.user) res.render('/login');
        user_id = validation.checkId(req.session.user._id, 'User ID');
        req.params.id = validation.checkId(req.params.id, 'User Page ID');
        if (user_id.equals(req.params.id)){
            throw `User ${req.session.user._id} cannot unfollow themselves`;
        }
        const user = await usersData.getUserById(req.params.id);
        //check to make sure user is following
        let following = false;
        for (const follower of user.followers) {
            if (follower.equals(user_id)) {
                following = true;
            }
        }
        if (!following) {
            throw `User ${user_id} does not follow user ${req.params.id}`;
        }
        const updatedUser = await usersData.unfollow(req.params.id, user_id);
        return res.render(`/users/${req.params.id}`);
    } catch (e) {
        return res.status(400).json({error: e});
    }
});


export default router;
import {Router} from 'express';
import {usersData} from '../data/index.js';
import * as validation  from '../validation.js';
import {fromPostman} from "../helpers.js";
import xss from 'xss';
import {ObjectId} from "mongodb";

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
            return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
        try {
            const users = await usersData.fuzzyFindUser(query);

            if (users === undefined)
                return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/home/`});

            const isEmpty = users.length === 0;
            if (fromPostman(req.headers['user-agent']))
              res.json({users: users});
            return res.render('users/searchResult', {userInfo: req.session.user, users: users, empty: isEmpty});
        } catch(e){
            return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
    });

router
    .route('/:id')
    .get(async (req, res) => {
      // req.session.user._id = new ObjectId(req.session.user._id);
        // let user_id;
        try {
          req.params.id = validation.checkId(req.params.id, 'User Page ID');
        } catch (e) {
          return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }

        try {
          const user = await usersData.getUserById(req.params.id);
          const userPosts = await usersData.getPostsFromUserId(req.params.id);
          let curr_user_id = new ObjectId(req.session.user._id);
          let owner = curr_user_id.equals(req.params.id);
          if (fromPostman(req.headers['user-agent']))
            return res.json({userInfo: req.session.user, user: user, posts: userPosts, owner: owner});

          let isFollowing = false;
          for (let following of req.session.user.following){
            if (following.username === user.username) {
              isFollowing = true;
              break;
            }
          }

          res.render('users/userSingle', {
            userInfo: req.session.user,
            user: user,
            posts: userPosts,
            owner: owner,
            isFollowing: isFollowing});
        } catch (e) {
          res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
    })
    .delete(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
        //code here for DELETE
        try {
            // if (!req.session.user) res.render('/login');
            // user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID');
        } catch (e) {
            return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
        let curr_user_id = req.session.user._id;

        try {
            if (!curr_user_id.equals(req.params.id)) {
                return res.status(403).render("error/error",{
                  userInfo: req.session.user,
                  error: `User ${req.session.user._id} does not own user ${req.params.id}'s profile`,
                  link: `/home/`});
            }

            let removed = await usersData.removeUser(req.params.id);
            if (!removed)
                return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/home/`});

            if (fromPostman(req.headers['user-agent']))
              return res.json({deleted: removed});

            req.session.destroy();
            return res.redirect('/register');
        } catch (e) {
            // e is always an array after removing user
            return res.status(e[0]).render("error/error",{userInfo: req.session.user, error: e[1], link:`/home/`});
        }
    });

router.route('/:id/followers').get(async (req, res) => {
  req.session.user._id = new ObjectId(req.session.user._id);
    //code here for GET
    try {
        // if (!req.session.user) res.render('/login');
        req.params.id = validation.checkId(req.params.id, 'User ID');
    } catch (e) {
        return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
    }

    try {
        const followerList = await usersData.getFollowers(req.params.id);
        if (fromPostman(req.headers['user-agent']))
          return res.json({followers: followerList});
        return res.render('users/followers', {userInfo: req.session.user, users: followerList});
    } catch(e) {
        return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/${req.params.id}`});
    }
});

router.route('/:id/likes').get(async (req, res) => {
  req.session.user._id = new ObjectId(req.session.user._id);
  //code here for GET
  try {
    // if (!req.session.user) res.render('/login');
    req.params.id = validation.checkId(req.params.id, 'User ID');
  } catch (e) {
    return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
  }

  try {
    const likedPosts = await usersData.getLikedPostsFromUserId(req.params.id);
    const user = await usersData.getUserById(req.params.id);
    if (fromPostman(req.headers['user-agent']))
      return res.json({posts: likedPosts});
    return res.render('posts/all', {
      userInfo: req.session.user,
      posts: likedPosts,
      subfeed: true,
      feedname: `${user.username}'s likes`});
  } catch(e) {
    return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/${req.params.id}`});
  }
})

router.route('/:id/following').get(async (req, res) => {
  req.session.user._id = new ObjectId(req.session.user._id);
    //code here for GET
    try {
        // if (!req.session.user) res.render('/login');
        req.params.id = validation.checkId(req.params.id, 'User ID');
    } catch (e) {
        return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
    }
    try {
        const followingList = await usersData.getFollowing(req.params.id);
        if (fromPostman(req.headers['user-agent']))
          return res.json({following: followingList});
        return res.render('users/following', {userInfo: req.session.user, users: followingList});
    } catch(e) {
        return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/${req.params.id}`});
    }
});

router
    .route('/:id/edit')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
        //code here for GET
        try {
            // if (!req.session.user) res.render('/login');
            // user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID');
        } catch (e) {
            return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
        try {
            const user_id = req.session.user._id;
            if (!user_id.equals(req.params.id)){
                return res.status(403).render("error/error",{userInfo: req.session.user,
                  error: `User${user_id} does not own ${req.params.id}'s profile.`, link:`/home/${req.params.id}`});
            }
            const user = await usersData.getUserById(req.params.id);
            if (fromPostman(req.headers['user-agent']))
              return res.json({user:user});
            return res.render('users/edit', {userInfo: req.session.user, user: user});
        } catch(e) {
            return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/${req.session.user._id}`});
        }
    })
    .patch(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
        //code here for PATCH
        req.body.userBio = xss(req.body.userBio);
        try {
            // if (!req.session.user) res.render('/login');
            // let user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID');
            req.body.userBio = validation.checkBio(req.body.userBio);
            const curr_user_id = req.session.user._id;
            if (!curr_user_id.equals(req.params.id)){
                return res.status(403).render("error/error",{userInfo: req.session.user,
                  error: `User ${req.session.user._id} does not own user ${req.params.id}`, link:`/home/`});
            }
        } catch (e) {
            return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
        try {
            const updatedUser = await usersData.updateUserBio(req.params.id, req.body.userBio);
            if (fromPostman(req.headers['user-agent']))
              return res.json({user: updatedUser, owner: true});
            return res.redirect(`/users/${req.params.id}`);
            // return res.render('users/single', {userInfo: req.session.user, user: updatedUser, owner: true});
        } catch(e) {
            return res.status(404).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
    });

router
    .route('/:id/follow')
    .patch(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
        //code here for PATCH
        try {
            // if (!req.session.user) res.render('/login');
            req.params.id = validation.checkId(req.params.id, 'User ID');
            let curr_user_id = req.session.user._id;

            if (curr_user_id.equals(req.params.id)){
                return res.status(400).render("error/error",{userInfo: req.session.user,
                  error: `User ${req.session.user._id} cannot follow themselves`, link:`/users/${curr_user_id}`});
            }
        } catch (e) {
            return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
        try {
            const updatedUser = await usersData.addFollower(req.params.id, req.session.user._id);

            req.session.user.following = await usersData.getFollowing(req.session.user._id);

            if (fromPostman(req.headers['user-agent']))
              return res.json({user: updatedUser, following: req.session.user.following})

            return res.redirect(`/users/${req.params.id}`);
        } catch(e) {
            console.log(e);
            return res.status(e[0]).render("error/error",{userInfo: req.session.user, error: e[1], link:`/users/${req.params.id}`});
        }
    });

router
    .route('/:id/unfollow')
    .patch(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
        //code here for PATCH
        try {
            // if (!req.session.user) res.render('/login');
            // user_id = validation.checkId(req.session.user._id, 'User ID');
            req.params.id = validation.checkId(req.params.id, 'User Page ID')
            let curr_user_id = req.session.user._id;

            if (curr_user_id.equals(req.params.id)){
                return res.status(400).render("error/error",{userInfo: req.session.user,
                  error: `User ${req.session.user._id} cannot unfollow themselves`, link:`/users/${curr_user_id}`});
            }
        } catch (e) {
            return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/home/`});
        }
        try {
            const updatedUser= await usersData.removeFollower(req.params.id, req.session.user._id);

            req.session.user.following = await usersData.getFollowing(req.session.user._id);

            if (fromPostman(req.headers['user-agent']))
              return res.json({user: updatedUser, following: req.session.user.following})

            return res.redirect(`/users/${req.params.id}`);
        } catch(e) {
            console.log(e);
            return res.status(e[0]).render("error/error",{userInfo: req.session.user, error: e[1], link:`/users/${req.params.id}`});
        }
    });


export default router;
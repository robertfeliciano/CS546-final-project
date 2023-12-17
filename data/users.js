import {users, posts} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcryptjs';
import * as postFunctions from './posts.js';
import * as commentFunctions from "./comments.js";
import * as val from '../validation.js';
import Fuse from 'fuse.js';
import {getMusicById} from "./music.js";
import {userAlreadyCommented} from "./comments.js";


const saltRounds = 16;

export const createUser = async (
    username,
    email,
    rawPassword,
    bio,
    profilePicture
) => {
    username = val.checkUsername(username);
    email = val.checkEmail(email);
    rawPassword = val.checkPass(rawPassword);
    bio = val.checkBio(bio);
    profilePicture = await val.checkProfilePic(profilePicture);


    const hashed = await bcrypt.hash(rawPassword, saltRounds);

    let newUser = {
        username:username.toLowerCase(),
        email:email.toLowerCase(),
        hashedPassword:hashed,
        userPosts:[],
        userComments:[],
        following:[],
        followers:[],
        likedPosts:[],
        bio:bio,
        profilePicture:profilePicture
    };

    const userCollection = await users();
    const emailDupes = await userCollection.find({email: email.toLowerCase()}).toArray();
    if (emailDupes.length > 0)
        throw `There is already a user with this email address.`;

    const usernameDupes = await userCollection.find({username: username.toLowerCase()}).toArray();
    if (usernameDupes.length > 0)
        throw `There is already a user with this username.`

    const insertInfo = await userCollection.insertOne(newUser);
    
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add user!';
    }
    
    return {insertedUser: true, _id: insertInfo.insertedId};
}

export const getAllUsers = async () => {
    const userCollection = await users();
    
    let userList = await userCollection
        .find({})
        .project({_id : 1, username:1, bio:1})
        .toArray();
    
    if (!userList) {
        throw 'Could not get all users';
    }

    return userList;
}

/**
 * gets the user information from the db based on the id
 * @param userId
 * @returns {Promise<*>}
 */
export const getUserById = async (userId) => {
    
    userId = val.checkId(userId, 'user id');

    const userCollection = await users();
    const user = await userCollection.findOne(
        {_id: new ObjectId(userId)},
        {projection: {hashedPassword: 0}}
    );

    if (user === null) {
        throw 'No user with that id';
    }

    return user;
}

export const fuzzyFindUser = async (username) => {
    username = val.checkUsername(username);

    const users = await getAllUsers();
    const options = {
        keys: ['username'], threshold: 0.45
    };
    const fuse_users = new Fuse(users, options);
    const users_found = fuse_users.search(username);

    return users_found.map(obj => obj.item);
}

export const getUserByName = async (username) => {

    username = val.checkUsername(username);

    const userCollection = await users();
    const user = await userCollection.findOne(
        {username: username}
    );

    if (user === null)
        throw `No user with username=${username}`;

    return {
        username: user.username,
        email: user.email,
        _id: user._id
    };
}

/**
 * removes a user from the db
 * also removes all posts that the user created
 * and removes the user from their followers' following list
 * and removes the user from their followings' followers list
 * @param userId id of user to be removed
 * @returns {Promise<{deleted: boolean, userName}>}
 */
export const removeUser = async (userId) => {

    try {
        userId = val.checkId(userId, 'user id');
    } catch(emsg) {
        throw [400, emsg];
    }

    const userCollection = await users();
    let user;
    try {
        user = await getUserById(userId);
    }
    catch (e) {
        throw [404, e];
    }
    const posts_to_remove = user.userPosts;
    const comments_to_remove = user.userComments;
    let user_name = user.username;
    const user_id_to_remove = new ObjectId(userId);

    for (const follower of user.followers) {
        const following_id = new ObjectId(follower);
        const updatedUser = await userCollection.findOneAndUpdate(
            {_id: following_id},
            {$pull: {following: user_id_to_remove}},
            {returnDocument: 'after'}
        )
        if (!updatedUser) throw [400, `Could not remove user: could not remove from users' following list`];
    }

    for (const following of user.following) {
        const following_id = new ObjectId(following);
        const updatedUser = await userCollection.findOneAndUpdate(
            {_id: following_id},
            {$pull: {followers: user_id_to_remove}},
            {returnDocument: 'after'}
        )
        if (!updatedUser) throw [400, `Could not remover user; could not remove from user's following list`]
    }

    // need to remove the user frm the list of likers on posts that they've liked
    for (let likedPostId of user.likedPosts) {
        likedPostId = new ObjectId(likedPostId);
        const unliked = await postFunctions.unlikePost(likedPostId, userId);
        if (!unliked) throw [400, `Could not remove user fully; could not remove user like from a likedPost`];
    }

    for (const post_id of posts_to_remove) {
        // this takes care of removing each post from the song it was posted under
        const del = await postFunctions.removePost(post_id, userId);
        if (!del.deleted) throw [400 `Could not remove user, could not remove user's posts`]
    }
    console.log('removed user posts');

    for (const comment_id of comments_to_remove) {
        const del = await commentFunctions.removeComment(comment_id, userId);
        if (!del.deleted) throw [400, `Could not remove user, could not remove user's comments`];
    }
    console.log('removed user comments');

    // finally... we delete the user
    const deletionInfo = await userCollection.findOneAndDelete({
        _id: new ObjectId(userId)
    });

    if (!deletionInfo) {
        throw [404, `Could not delete user with id of ${userId}`];
    }

    return {userName: user_name, deleted: true};
}


/**
 * makes user b follow user a
 * @param user_to_follow user a
 * @param new_follower_id user b
 * @returns {Promise<{followers: ([]|*)}>}
 */
export const addFollower = async (user_to_follow, new_follower_id) => {

    try {
        user_to_follow = val.checkId(user_to_follow, 'user to follow id');
        new_follower_id = val.checkId(new_follower_id, 'new follower id');
    } catch(emsg) {
        throw [400, emsg];
    }

    // first check if user b already follows user a
    const userCollection = await users();
    const check = await userCollection.find(
        {
            _id: user_to_follow,
            followers: new ObjectId(new_follower_id)
        }).toArray();

    if (check.length > 0)
        throw [204, `User ${new_follower_id} already follows ${user_to_follow}`];

    const updatedUserAFollowers = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(user_to_follow)},
        {$push: {followers: new ObjectId(new_follower_id)}},
        {returnDocument: 'after'}
    );
    if (!updatedUserAFollowers) {
        throw [404, `Could not follow user with id of ${user_to_follow}`];
    }

    const updatedUserBFollowing = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(new_follower_id)},
        {$push: {following: new ObjectId(user_to_follow)}},
        {returnDocument: 'after'}
    );
    if (!updatedUserBFollowing) {
        throw [404, `Could not add ${new_follower_id} to following list of user ${user_to_follow}`];
    }
    return {following: updatedUserBFollowing.following, followers: updatedUserAFollowers.followers};
}

export const removeFollower = async (user_to_unfollow, unfollower_id) => {
    try {
        user_to_unfollow = val.checkId(user_to_unfollow, 'user to unfollow id');
        unfollower_id = val.checkId(unfollower_id, 'unfollower id');
    } catch(emsg) {
        throw [400, emsg];
    }

    // first check if user b doesnt already follow user a
    const userCollection = await users();
    const check = await userCollection.find(
        {
            _id: new ObjectId(user_to_unfollow),
            followers: new ObjectId(unfollower_id)
        }).toArray();

    if (check.length === 0)
        throw [204, `User ${unfollower_id} doesn't already follow ${user_to_unfollow}`];

    const updatedUserAFollowers = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(user_to_unfollow)},
        {$pull: {followers: new ObjectId(unfollower_id)}},
        {returnDocument: 'after'}
    );
    if (!updatedUserAFollowers) {
        throw [404, `Could not follow user with id of ${user_to_unfollow}`];
    }

    const updatedUserBFollowing = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(unfollower_id)},
        {$pull: {following: new ObjectId(user_to_unfollow)}},
        {returnDocument: 'after'}
    );
    if (!updatedUserBFollowing) {
        throw [404, `Could not add ${unfollower_id} to following list of user ${user_to_unfollow}`];
    }
    return {following: updatedUserBFollowing.following, followers: updatedUserAFollowers.followers};
}

const updateUserPut = async (
    userId,
    userPost,
    userComment,
    friend
) => {

    const userCollection = await users();
    let curr_user = await getUserById(userId);
    curr_user.userPosts.push(userPost);
    curr_user.userComments.push(userComment);
    curr_user.friends.push(friend);
    const updatedUser = {
        userPosts:curr_user.userPosts,
        userComments:curr_user.userComments,
        friends:curr_user.friends
    };

    const updatedInfo = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(userId)},
        {$set: updatedUser},
        {returnDocument: 'after'}
    );

    if (!updatedInfo) {
        throw [404, 'Could not update user successfully'];
    }

    return updatedInfo;
}


/**
 *
 * @param userId
 * @param userInfo
 * @returns {Promise<*>}
 */
const updateUserPatch = async (
    userId,
    userInfo
) => {

    const userCollection = await users();
    const updatedInfo = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(userId)},
        {$set: userInfo},
        {returnDocument: 'after'}
    );
    
    if (!updatedInfo) {
        throw [404, 'Could not update user successfully'];
    }

    return updatedInfo;
}

export const updateUserBio = async (userId, newBio) => {
    const userCollection = await users();
    userId = val.checkId(userId);
    newBio = val.checkBio(newBio);
    const updatedInfo = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(userId)},
        {$set: {bio: newBio}},
        {returnDocument: 'after'}
    )
    if (!updatedInfo)
        throw `Could not update user ${userId}'s bio successfully!`;
    return updatedInfo;
}


/**
 * This function will be called when a user submits the login form
 * @param emailAddress email of user
 * @param password password of user
 * @returns {Promise<{hashedPassword: *, email: *, username}>}
 */
export const loginUser = async (emailAddress, password) => {

    emailAddress = val.checkEmail(emailAddress);
    password = val.checkPass(password);

    const db = await users();
    const user = await db.findOne({email: emailAddress.toLowerCase()});
    if (user === null) throw `Either the email address or password is invalid`;
    
    const following_list = await getFollowing(user._id);
    let comp = await bcrypt.compare(password, user.password);
    if (comp)
        return {
            _id: new ObjectId(user._id),
            username: user.username,
            email: user.email,
            following: following_list,
            profilePicture: user.profilePicture
        };
    else
        throw `Either the email address or password is invalid`;
}

export const alreadyLikedPost = async (userId, postId) => {
    userId = val.checkId(userId, 'user id');
    postId = val.checkId(postId, 'post id');
    const userCollection = await users();
    const userLikedPost = await userCollection.findOne({
        _id: new ObjectId(userId),
        likedPosts: new ObjectId(postId)
    });
    if (userLikedPost)
        return true;
    else
        return false;
}

export const userOwnsPost = async (userId, postId) => {
    userId = val.checkId(userId, 'user id');
    postId = val.checkId(postId, 'post id');
    const userCollection = await users();
    const foundPost = await userCollection.findOne({
        _id: new ObjectId(userId),
        userPosts: new ObjectId(postId)
    });
    if (foundPost)
        return true;
    else
        return false;
}

export const getRecommendations = async(userId) => {

    userId = val.checkId(userId, 'user id');

    let user = await getUserById(userId);

    const postCollection = await posts();

    const postList = await postCollection
      .find({user_id: {$in: user.following}})
      .toArray();

    const userPostMusicIds = []
    for (let post of user.userPosts) {
        let curr_post = await postFunctions.getPostById(post);
        userPostMusicIds.push(curr_post.music_id);
    }

    let filteredPostList = postList.filter(post => !userPostMusicIds.includes(post.music_id));


    const musicIdFrequency = filteredPostList.reduce((map, post) => {
        const musicId = post.music_id;
        map[musicId] = (map[musicId] || 0) + 1;
        return map;
      }, {});

    const sortedMusicIds = Object
                                        .keys(musicIdFrequency)
                                        .sort(
                                            (a, b) => musicIdFrequency[b] - musicIdFrequency[a]
                                        );
    const musicRecs = await Promise.all(
        sortedMusicIds.map(
            async (id) => await getMusicById(new ObjectId(id))
        )
    );

    return musicRecs;

}

export const getFollowing = async (userId) => {
    userId = val.checkId(userId, 'user id');

    const userCollection = await users();

    const following = userCollection.aggregate([
        {
            '$match': {
                '_id': new ObjectId(userId)
            }
        }, {
            '$unwind': '$following'
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'following',
                'foreignField': '_id',
                'as': 'following'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$arrayElemAt': [
                        '$following', 0
                    ]
                }
            }
        }, {
            '$project': {
                'username': 1,
                'profilePicture': 1
            }
        }
    ]).toArray();
    if (!following)
        throw `Could not get following list for user with id ${userId}`;
    return following;
}

export const getFollowers = async (userId) => {
    userId = val.checkId(userId, 'user id');

    const userCollection = await users();

    const followers = userCollection.aggregate([
        {
            '$match': {
                '_id': new ObjectId(userId)
            }
        }, {
            '$unwind': '$followers'
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'followers',
                'foreignField': '_id',
                'as': 'followers'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$arrayElemAt': [
                        '$followers', 0
                    ]
                }
            }
        }, {
            '$project': {
                'username': 1
            }
        }
    ]).toArray();
    if (!followers)
        throw `Could not get following list for user with id ${userId}`;
    return followers;
}

export const getPostsFromUserId = async (userId) => {
    userId = val.checkId(userId, 'user id');

    let userCollection = await users();
    let userPosts = await userCollection.aggregate([
        {
            '$match': {
                '_id': new ObjectId(userId)
            }
        }, {
            '$unwind': '$userPosts'
        }, {
            '$lookup': {
                'from': 'posts',
                'localField': 'userPosts',
                'foreignField': '_id',
                'as': 'postInfo'
            }
        }, {
            '$set': {
                'postInfo': {
                    '$arrayElemAt': [
                        '$postInfo', 0
                    ]
                }
            }
        }, {
            '$replaceRoot': {
                'newRoot': '$postInfo'
            }
        }, {
            '$lookup': {
                'from': 'music',
                'localField': 'music_id',
                'foreignField': '_id',
                'as': 'musicInfo'
            }
        }, {
            '$set': {
                'musicInfo': {
                    '$arrayElemAt': [
                        '$musicInfo', 0
                    ]
                }
            }
        }, {
            '$set': {
                'piecename': '$musicInfo.name'
            }
        }, {
            '$project': {
                'musicInfo': 0,
                'comments': 0
            }
        }
    ]).toArray();

    if (!userPosts)
        throw `Could not get posts for user with id ${userId}`;

    return userPosts;
}

export const getLikedPostsFromUserId = async (userId) => {
    userId = val.checkId(userId);

    const userCollection = await users();
    const likedPosts = await userCollection.aggregate([
        {
            '$match': {
                '_id': new ObjectId(userId)
            }
        }, {
            '$unwind': '$likedPosts'
        }, {
            '$lookup': {
                'from': 'posts',
                'localField': 'likedPosts',
                'foreignField': '_id',
                'as': 'postInfo'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$arrayElemAt': [
                        '$postInfo', 0
                    ]
                }
            }
        }, {
            '$lookup': {
                'from': 'music',
                'localField': 'music_id',
                'foreignField': '_id',
                'as': 'musicInfo'
            }
        }, {
            '$set': {
                'musicInfo': {
                    '$arrayElemAt': [
                        '$musicInfo', 0
                    ]
                }
            }
        }, {
            '$set': {
                'piecename': '$musicInfo.name',
                'artist': '$musicInfo.artist',
            }
        }, {
            '$project': {
                'musicInfo': 0,
                'comments': 0
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'userInfo'
            }
        }, {
            '$set': {
                'username': {
                    '$arrayElemAt': [
                        '$userInfo.username', 0
                    ]
                },
                'profilePicture': {
                    '$arrayElemAt': [
                        '$userInfo.profilePicture', 0
                    ]
                }
            }
        }, {
            '$project': {
                'userInfo': 0
            }
        }
    ]).toArray();

    if (!likedPosts)
        throw `Could not get liked posts for user with id ${userId}`;

    return likedPosts;
}
// console.log(await getLikedPostsFromUserId('657ceae06d66b79009b45de3'));
// console.log(await getFollowing('657dd1dde3ba67bd632a3119'));

// console.log(await getRecommendations('657f1c2530c072dff4c24667'));
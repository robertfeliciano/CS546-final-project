import {comments, users, posts} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcryptjs';
import * as postFunctions from './posts.js';
import * as validation from '../validation.js';


const saltRounds = 16;

export const createUser = async (
    username,
    email,
    rawPassword,
    bio,
    profilePicture
) => {

    //input validation


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

    // const newId = insertInfo.insertedId.toString();
    // const new_user = await getUserById(newId);
    
    return {insertedUser: true, _id: insertInfo.insertedId};
}

export const getAllUsers = async () => {
    const userCollection = await users();
    
    let userList = await userCollection
        .find({})
        .project({_id : 1, username:1})
        .toArray();
    
    if (!userList) {
        throw 'Could not get all users';
    }

    return userList;
}

/**
 * gets the user information from teh db based on the id
 * @param userId
 * @returns {Promise<*>}
 */
export const getUserById = async (userId) => {
    
    //input validation

    const userCollection = await users();
    const user = await userCollection.findOne(
        {_id: new ObjectId(userId)},
        {hashedPassword: 0}
    );

    if (user === null) {
        throw 'No user with that id';
    }

    return user;
}

export const getUserByName = async (username) => {
    //input validation (name should be trimmed)
    // switch this to fuzzy search later
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

    //input validation 

    const userCollection = await users();
    const commentsCollection = await comments();
    let user = await getUserById(userId);
    const posts_to_remove = user.userPosts;
    const comments_to_remove = user.userComments;
    let user_name = user.username;
    const user_id_to_remove = new ObjectId(userId);

    for (const follower of user.followers) {
        const following_id = new ObjectId(follower);
        await userCollection.findOneAndUpdate(
            {_id: following_id},
            {$pull: {following: user_id_to_remove}}
        )
    }

    for (const following of user.following) {
        const following_id = new ObjectId(following);
        await userCollection.findOneAndUpdate(
            {_id: following_id},
            {$pull: {followers: user_id_to_remove}}
        )
    }

    for (const post_id of posts_to_remove) {
        // this takes care of removing each post from the song it was posted under
        await postFunctions.removePost(post_id, userId);
    }

    for (const comment_id of comments_to_remove) {
        await commentsCollection.findOneAndDelete({_id: comment_id});
    }



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
export const updateFollowers = async (user_to_follow, new_follower_id) => {
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
        {_id: new ObjectId(user_to_follow)},
        {$push: {following: new ObjectId(new_follower_id)}},
        {returnDocument: 'after'}
    );
    if (!updatedUserBFollowing) {
        throw [404, `Could not add ${new_follower_id} to following list of user ${user_to_follow}`];
    }
    return {following: updatedUserBFollowing.following, followers: updatedUserAFollowers.followers};
}

export const updateUserPut = async (
    userId,
    userPost,
    userComment,
    friend
) => {

    //input validation 

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
export const updateUserPatch = async (
    userId,
    userInfo
) => {
    
    //input validation

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


/**
 * This function will be called when a user submits the login form
 * @param emailAddress email of user
 * @param password password of user
 * @returns {Promise<{hashedPassword: *, email: *, username}>}
 */
export const loginUser = async (emailAddress, password) => {
    // input validation

    const db = await users();
    const user = await db.findOne({emailAddress: emailAddress.toLowerCase()});
    if (user === null) throw `Either the email address or password is invalid`;
    let comp = await bcrypt.compare(password, user.password);
    if (comp)
        return {
            _id: user._id,
            username: user.username,
            email: user.email,
            following: user.following
        };
    else
        throw `Either the email address or password is invalid`;
}

export const getRecommendations = async(userId) => {
    //input validation 

    let user = await getUserById(userId)

    const postCollection = await posts();
    
    const postList = await postCollection
      .find({user_id: {$in: user.following}})
      .toArray()
    
    const userPostMusicIds = []
    for (let post of user.userPosts) {
        let curr_post = await postFunctions.getPostById(post)
        userPostMusicIds.push(curr_post.music_id)
    }
    
    const filteredPostList = postList.filter(post => !userPostMusicIds.includes(post.music_id))

    const musicIdFrequency = filteredPostList.reduce((map, post) => {
        const musicId = post.music_id;
        map[musicId] = (map[musicId] || 0) + 1;
        return map;
      }, {});

    const sortedMusicIds = Object.keys(musicIdFrequency).sort((a, b) => musicIdFrequency[b] - musicIdFrequency[a]);

    return sortedMusicIds

}   
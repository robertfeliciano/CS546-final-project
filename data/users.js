import {users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as validation from '../validation.js;'

export const createUser = async (
    username,
    email,
    hashedPassword,
    usersPosts,
    userComments,
    friends,
    bio,
    profilePicture
) => {

    //input validation

    let newUser = {
        username:username,
        Email:email,
        hashedPassword:hashedPassword,
        usersPosts:usersPosts,
        userComments:userComments,
        friends:friends,
        bio:bio,
        profilePicture:profilePicture
    };

    const userCollection = await users();
    const insertInfo = await userCollection.insertOne(newUser);
    
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add user!';
    }

    const newId = insertInfo.insertedId.toString();
    const new_user = await getUserById(newId);
    
    return new_user;
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

export const getUserById = async (userId) => {
    
    //input validation

    const userCollection = await users();
    const user = await userCollection.findOne({_id: new ObjectId(userId)});

    if (user === null) {
        throw 'No user with that id';
    }

    return user;
}

export const removeUser = async (userId) => {

    //input validation 

    const userCollection = await users();
    let user = await getUserById(userId);
    let user_name = user['username'];
    
    const deletionInfo = await userCollection.findOneAndDelete({
        _id: new ObjectId(userId)
    });
    
    if (!deletionInfo) {
        throw [404, `Could not delete user with id of ${userId}`];
    }

    return {userName: user_name, deleted: true};
}

export const updatePut = async (
    userId,
    userPost,
    userComment,
    friend
) => {

    //input validation 

    const userCollection = await users();
    let curr_user = await getUserById(userId);
    curr_user.usersPosts.push(userPost);
    curr_user.userComments.push(userComment);
    curr_user.friends.push(friend);
    const updatedUser = {
        usersPosts:curr_user.usersPosts,
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

export const updatePatch = async (
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

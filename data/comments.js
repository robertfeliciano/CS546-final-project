import {comments, posts, users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as validation from '../validation.js';

export const createComment = async (
    post_id,
    user_id,
    content,
    date
) => {

    //input validation

    let newComment = {
        post_id:post_id,
        user_id:user_id,
        content:content,
        date:date
    };

    const commentsCollection = await comments();
    const insertInfo = await commentsCollection.insertOne(newComment);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add comment!';
    }

    const userCollection = await users();
    let update_user_info = await userCollection.findOneAndUpdate(
        {_id: user_id},
        {$push: {userComments: insertInfo.insertedId}}
    );
    if (!update_user_info)
        throw `Could not add comment to ${user_id}'s comment collection!`;

    const postCollection = await posts();
    let update_post_info = await userCollection.findOneAndUpdate(
        {_id: user_id},
        {$push: {comments: insertInfo.insertedId}}
    );
    if (!update_post_info)
        throw `Could not add comment to ${user_id}'s comment collection!`;

    const newId = insertInfo.insertedId.toString();
    const new_comment = await getCommentById(newId);
    
    return new_comment;
}

export const getAll = async () => {
    const commentsCollection = await comments();
    
    let commentsList = await commentsCollection
        .find({})
        .project({_id : 1, content:1})
        .toArray();
    
    if (!commentsList) {
        throw 'Could not get all posts';
    }

    return commentsList;
}

export const getCommentById = async (commentId) => {
    
    //input validation

    const commentsCollection = await comments();
    const comment = await commentsCollection.findOne({_id: new ObjectId(commentId)});

    if (comment === null) {
        throw 'No comment with that id';
    }

    return comment;
}

export const removeComment = async (commentId) => {

    //input validation 

    const commentsCollection = await comments();
    let comment = await getCommentById(commentId);
    const comment_id_to_remove = new ObjectId(commentId);
    const user_id = new ObjectId(comment.user_id);
    const post_id = new ObjectId(comment.post_id)

    const userCollection = await users();
    const userUpdatedInfo = await userCollection.findOneAndUpdate(
        {_id: user_id},
        {$pull: {userComments: comment_id_to_remove}},
        {returnDocument: 'after'}
    );
    if (!userUpdatedInfo)
        throw [404, `Could not delete comment with id of ${commentId} from user ${user_id.toString()}`];

    const postCollection = await posts();
    const postUpdatedInfo = await postCollection.findOneAndUpdate(
        {_id: post_id},
        {$pull: {comments: comment_id_to_remove}},
        {returnDocument: 'after'}
    );
    if (!postUpdatedInfo)
        throw [404, `Could not delete comment with id of ${commentId} from user ${user_id.toString()}`];
    
    const deletionInfo = await commentsCollection.findOneAndDelete({
        _id: new ObjectId(commentId)
    })
    
    if (!deletionInfo) {
        throw [404, `Could not delete comment with id of ${commentId}`];
    }

    return {deleted: true};
}
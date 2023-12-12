import {comments, posts, users} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as val from '../validation.js';

export const createComment = async (
    post_id,
    user_id,
    content,
    date
) => {

    post_id = val.checkId(post_id, "post id");
    user_id = val.checkId(user_id, "user id");
    content = val.checkString(content, "comment content");
    date = val.checkDate(date);

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
        throw `Could not add comment to user ${user_id}'s comment collection!`;

    const postCollection = await posts();
    let update_post_info = await postCollection.findOneAndUpdate(
        {_id: post_id},
        {$push: {comments: insertInfo.insertedId}}
    );
    if (!update_post_info)
        throw `Could not add comment to post ${post_id}'s comment collection!`;

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

    commentId = val.checkId(commentId, "comment id");

    const commentsCollection = await comments();
    const comment = await commentsCollection.findOne({_id: new ObjectId(commentId)});

    if (comment === null) {
        throw 'No comment with that id';
    }

    return comment;
}

export const removeComment = async (commentId, deleterId) => {

    commentId = val.checkId(commentId, "comment id");
    deleterId = val.checkId(deleterId, 'deleter id');


    const commentsCollection = await comments();
    let comment = await getCommentById(commentId);

    const comment_id_to_remove = new ObjectId(commentId);
    const user_id = new ObjectId(comment.user_id);
    const post_id = new ObjectId(comment.post_id)
    commentId = new ObjectId(commentId);

    if (!commentId.equals(user_id)) throw [500, `Only the original poster is allowed to delete a comment`];

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
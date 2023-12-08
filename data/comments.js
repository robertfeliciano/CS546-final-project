import {comments} from '../config/mongoCollections.js';
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

    const newId = insertInfo.insertedId.toString();
    const new_comment = await get(newId);
    
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

export const get = async (commentId) => {
    
    //input validation

    const commentsCollection = await comments();
    const comment = await commentsCollection.findOne({_id: new ObjectId(commentId)});

    if (comment === null) {
        throw 'No comment with that id';
    }

    return comment;
}

export const remove = async (commentId) => {

    //input validation 

    const commentsCollection = await comments();
    let comment = await get(commentId);
    let comment_content = comment['content'];
    
    const deletionInfo = await commentsCollection.findOneAndDelete({
        _id: new ObjectId(commentId)
    })
    
    if (!deletionInfo) {
        throw [404, `Could not delete comment with id of ${commentId}`];
    }

    return {comment: comment_content, deleted: true};
}
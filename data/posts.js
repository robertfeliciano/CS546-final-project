import {posts} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

export const createPost = async (
    song_id,
    rating,
    user_id,
    content,
    date,
    likes
) => {

    //input validation

    let newPost = {
        song_id:song_id,
        rating:rating,
        user_id:user_id,
        content:content,
        date:date,
        likes:likes
    }

    const postsCollection = await posts()
    const insertInfo = await postsCollection.insertOne(newPost)
    
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add post!'
    }

    const newId = insertInfo.insertedId.toString()
    const new_post = await get(newId)
    
    return new_post
}

export const getAll = async () => {
    const postsCollection = await posts()
    
    let postList = await postsCollection
        .find({})
        .toArray()
    
    if (!postList) {
        throw 'Could not get all posts'
    }

    return postList
}

export const get = async (postId) => {
    
    //input validation

    const postsCollection = await posts()
    const post = await postsCollection.findOne({_id: new ObjectId(postId)})

    if (post === null) {
        throw 'No post with that id'
    }

    return post
}

export const remove = async (postId) => {

    //input validation 

    const postsCollection = await posts()
    let post = await get(postId)
    let post_content = post['content']
    
    const deletionInfo = await postsCollection.findOneAndDelete({
        _id: new ObjectId(postId)
    })
    
    if (!deletionInfo) {
        throw [404, `Could not delete post with id of ${postId}`]
    }

    return {post: post_content, deleted: true}
}

export const update = async (
    postId,
    like
) => {

    //input validation 

    const postsCollection = await posts()
    const curr_post = await get(postId)
    curr_post.likes.push(like)
    const updatedPost = {
        likes:curr_post.likes
    }

    const updatedInfo = await postsCollection.updateOne(
        {_id: new ObjectId(postId)},
        {$set: updatedPost},
        {returnDocument: 'after'}
    )

    if (!updatedInfo) {
        throw [404, 'Could not update post successfully']
    }

    return updatedInfo
}
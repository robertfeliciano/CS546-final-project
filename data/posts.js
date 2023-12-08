import {posts, users, songs} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as validation from '../validation.js';

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
    };

    const postsCollection = await posts();
    const insertInfo = await postsCollection.insertOne(newPost);
    
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add post!';
    }

    const newId = insertInfo.insertedId.toString();
    const new_post = await getPostById(newId);
    
    return new_post;
}

export const getAllPosts = async () => {
    const postsCollection = await posts();
    
    let postList = await postsCollection
        .find({})
        .toArray();
    
    if (!postList) {
        throw 'Could not get all posts';
    }

    return postList;
}

export const getPostById = async (postId) => {
    
    //input validation

    const postsCollection = await posts();
    const post = await postsCollection.findOne({_id: new ObjectId(postId)});

    if (post === null) {
        throw 'No post with that id';
    }

    return post;
}

export const remove = async (postId) => {

    //input validation 

    const postsCollection = await posts();
    let post = await getPostById(postId);
    let post_content = post['content'];
    
    const deletionInfo = await postsCollection.findOneAndDelete({
        _id: new ObjectId(postId)
    })
    
    if (!deletionInfo) {
        throw [404, `Could not delete post with id of ${postId}`];
    }

    // get the user that made this post from the DB
    const userCollection = await users();
    const user_id = new ObjectId(post.user_id);
    let user = userCollection.findOne({_id: user_id});
    let user_posts = user.userPosts;

    // remove the post from the userPosts array
    let index_of_deleted_post = user_posts.indexOf(postId);
    user_posts.splice(index_of_deleted_post, 1);
    user.userPosts = user_posts;

    // update the user in the DB with the new userPosts array
    const userUpdatedInfo = users.findOneAndUpdate(
        {_id: user_id},
        {$set: user},
        {returnDocument: 'after'}
    );

    if (!userUpdatedInfo)
        throw `Could not delete post with id of ${postId}`;

    const songCollection = await songs();
    const song_id = new ObjectId(post.song_id);
    let song = songCollection.findOne({_id: song_id});
    let song_posts = song.posts;
    index_of_deleted_post = song_posts.indexOf(postId);
    song_posts.splice(index_of_deleted_post, 1);
    song.posts = song_posts;

    // update the song in the DB with the new song_posts array
    const songUpdatedInfo = users.findOneAndUpdate(
        {_id: song_id},
        {$set: song},
        {returnDocument: 'after'}
    );

    if (!songUpdatedInfo)
        throw `Could not delete post with id of ${postId}`;

    return {deleted: true};
}

export const update = async (
    postId,
    like
) => {

    //input validation 

    const postsCollection = await posts();
    const curr_post = await getPostById(postId);
    curr_post.likes.push(like);
    const updatedPost = {
        likes:curr_post.likes
    }

    const updatedInfo = await postsCollection.updateOne(
        {_id: new ObjectId(postId)},
        {$set: updatedPost},
        {returnDocument: 'after'}
    );

    if (!updatedInfo) {
        throw [404, 'Could not update post successfully'];
    }

    return updatedInfo
}
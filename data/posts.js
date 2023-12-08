import {posts, users, music} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as validation from '../validation.js';


export const createPost = async (
    music_id,
    rating,
    user_id,
    content,
    date
) => {

    //input validation

    let newPost = {
        music_id:music_id,
        rating:rating,
        user_id:user_id,
        content:content,
        date:date,
        comments:[],
        likes:0
    };

    // add post to post db
    const postsCollection = await posts();
    const insertInfo = await postsCollection.insertOne(newPost);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add post!';
    }

    const userCollection = await users();
    let update_user_info = await userCollection.findOneAndUpdate(
        {_id: user_id},
        {$push: {userPosts: insertInfo.insertedId}}
    );
    if (!update_user_info)
        throw `Could not add post to ${user_id}'s post collection!`;

    const musicCollection = await music();
    let update_song_info = await musicCollection.findOneAndUpdate(
        {_id: music_id},
        {
            $push: {posts: insertInfo.insertedId},
            $inc:
                {
                    total_stars: rating,
                    total_rankings: 1
                }
        }
    );
    if (!update_song_info)
        throw `Could not add post to ${user_id}'s post collection!`;

    const newId = insertInfo.insertedId.toString();
    const new_post = await getPostById(newId);
    
    return new_post;
}

/**
 * get all posts on the db
 * @returns {Promise<*>}
 */
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

/**
 * get a post by an id
 * this will be called when a user clicks on a post to expand it
 * @param postId
 * @returns {Promise<*>}
 */
export const getPostById = async (postId) => {
    
    //input validation

    const postsCollection = await posts();
    const post = await postsCollection.findOne({_id: new ObjectId(postId)});

    if (post === null) {
        throw 'No post with that id';
    }

    return post;
}

/**
 * delete a post from the db
 * this post will have to be removed from the user's posts array
 * and the array of any song/album it was posted about
 * @param postId
 * @returns {Promise<{deleted: boolean}>}
 */
export const removePost = async (postId) => {

    //input validation 

    const postsCollection = await posts();
    let post = await getPostById(postId);
    const post_id_to_remove = new ObjectId(postId);
    const music_id = new ObjectId(post.music_id);
    const user_id = new ObjectId(post.user_id);

    // remove post from user that posted it
    const userCollection = await users();
    const userUpdatedInfo = await userCollection.findOneAndUpdate(
        {_id: user_id},
        {$pull: {userPosts: post_id_to_remove}},
        {returnDocument: 'after'}
    );
    if (!userUpdatedInfo)
        throw [404, `Could not delete post with id of ${postId} from user ${user_id.toString()}`];

    // remove post from song it belongs to
    const musicCollection = await music();
    const songUpdatedInfo = await musicCollection.findOneAndUpdate(
        {_id: music_id},
        {$pull: {posts: post_id_to_remove}},
        {returnDocument: 'after'}
    );
    if (!songUpdatedInfo)
        throw [404, `Could not delete post with id of ${postId} from piece ${music_id.toString()}`];

    const deletionInfo = await postsCollection.findOneAndDelete({
        _id: new ObjectId(postId)
    });

    if (!deletionInfo) {
        throw [404, `Could not delete post with id of ${postId}`];
    }

    return {deleted: true};
}


/**
 * the only thing that can be updated on a post is the number of likes it has
 * @param postId the id of the post to update
 * @param liker_id the id of the person who liked the post
 * @returns {Promise<*>}
 */
export const updatePost = async (
    postId,
    liker_id
) => {

    //input validation 

    const postsCollection = await posts();

    const updatedInfo = await postsCollection.findOneAndUpdate(
        {_id: new ObjectId(postId)},
        {$push: {likes: new ObjectId(liker_id)}},
        {returnDocument: 'after'}
    );

    if (!updatedInfo) {
        throw [404, 'Could not update post successfully'];
    }

    return updatedInfo
}
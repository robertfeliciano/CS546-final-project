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
    const song_id = new ObjectId(post.song_id);
    const user_id = new ObjectId(post.user_id);

    // remove post from user that posted it
    const userCollection = await users();
    const userUpdatedInfo = userCollection.findOneAndUpdate(
        {_id: user_id},
        {$pull: {userPosts: post_id_to_remove}},
        {returnDocument: 'after'}
    );
    if (!userUpdatedInfo)
        throw [404, `Could not delete post with id of ${postId} from user ${user_id.toString()}`];

    const songCollection = await songs();
    // remove post from song it belongs to
    const songUpdatedInfo = songCollection.findOneAndUpdate(
        {_id: song_id},
        {$pull: {posts: post_id_to_remove}},
        {returnDocument: 'after'}
    );

    if (!songUpdatedInfo)
        throw [404, `Could not delete post with id of ${postId} from song ${song_id.toString()}`];

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
export const update = async (
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
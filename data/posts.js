import {posts, users, music, comments} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import * as val from '../validation.js';


export const createPost = async (
    music_id,
    rating,
    user_id,
    content,
    date
) => {

    music_id = val.checkId(music_id, 'music piece id');
    rating = val.checkRating(rating, 'music rating');
    user_id = val.checkId(user_id, 'user id');
    content = val.checkString(content, 'post content');
    date = val.checkDate(date);

    let newPost = {
        music_id:music_id,
        rating:rating,
        user_id:user_id,
        content:content,
        date:date,
        comments:[],
        likes:[]
    };

    // add post to post db
    const postsCollection = await posts();
    const insertInfo = await postsCollection.insertOne(newPost);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add post!';
    }
    const userCollection = await users();
    let update_user_info = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(user_id)},
        {$push: {userPosts: insertInfo.insertedId}},
        {returnDocument: 'after'}
    );
    if (!update_user_info)
        throw `Could not add post to user ${user_id}'s post collection!`;

    const musicCollection = await music();
    let update_song_info = await musicCollection.findOneAndUpdate(
        {_id: new ObjectId(music_id)},
        {
            $push: {posts: insertInfo.insertedId},
            $inc:
                {
                    total_stars: rating,
                    total_ratings: 1
                }
        },
        {returnDocument: 'after'}
    );
    if (!update_song_info)
        throw `Could not add update posts for music piece ${music_id}'s post collection!`;

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
    
    let postList = await postsCollection.aggregate([
        {
            '$lookup': {
                'from': 'users',
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'userInfo'
            }
        }, {
            '$set': {
                'userInfo': {
                    '$arrayElemAt': [
                        '$userInfo', 0
                    ]
                }
            }
        }, {
            '$set': {
                'username': '$userInfo.username'
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
                'userInfo': 0,
                'musicInfo': 0
            }
        }
    ]).toArray();
    
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
    
    postId = val.checkId(postId, 'post id');

    const postsCollection = await posts();
    const post = await postsCollection.aggregate([
        {
            '$match': {
                '_id': new ObjectId(postId)
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'userInfo'
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
                'username': {
                    '$arrayElemAt': [
                        '$userInfo.username', 0
                    ]
                },
                'piecename': {
                    '$arrayElemAt': [
                        '$musicInfo.name', 0
                    ]
                },
                'artist': {
                    '$arrayElemAt': [
                        '$musicInfo.artist', 0
                    ]
                }
            }
        }, {
            '$project': {
                'userInfo': 0,
                'musicInfo': 0
            }
        }
    ]).toArray();

    if (post === null) {
        throw 'No post with that id';
    }

    return post[0];
}

export const getAllPostsFromFollowing = async (userId) => {

    userId = val.checkId(userId, 'user id');

    const userCollection = await users();
    const postsCollection = await posts();

    const user = await userCollection.findOne({_id: new ObjectId(userId)});
    if (!user)
        throw `Could not find user with id: ${userId.toString()}`;
    const followingList = user.following;

    const postsFound = await postsCollection.aggregate([
        {
            '$match': {
                'user_id': {
                    '$in': followingList
                }
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
                'userInfo': {
                    '$arrayElemAt': [
                        '$userInfo', 0
                    ]
                }
            }
        }, {
            '$set': {
                'username': '$userInfo.username'
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
                'artist': '$musicInfo.artist'
            }
        }, {
            '$project': {
                'userInfo': 0,
                'musicInfo': 0
            }
        }
    ]).toArray();

    if (postsFound === null)
        throw `Could not get posts from followed users.`;

    return postsFound;
}

export const getAllPostsFromMusicId = async (musicId) => {

    musicId = val.checkId(musicId, 'music id');

    const postCollection = await posts();
    const postsFound = await postCollection.aggregate([
        {
            '$match': {
                'music_id': new ObjectId(musicId)
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'userInfo'
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
                },
                'userInfo': {
                    '$arrayElemAt': [
                        '$userInfo', 0
                    ]
                }
            }
        }, {
            '$set': {
                'username': '$userInfo.username',
                'piecename': '$musicInfo.name'
            }
        }
    ]).toArray();

    if (postsFound === null)
        throw `Could not get posts from musicId ${musicId}`;

    return postsFound;
}

/**
 * delete a post from the db
 * this post will have to be removed from the user's posts array
 * and the array of any song/album it was posted about
 * @param postId id of post that needs to be deleted
 * @param deleterId id of user trying to delete the post
 * @returns {Promise<{deleted: boolean}>}
 */
export const removePost = async (postId, deleterId) => {

    try {
        postId = val.checkId(postId, 'post id');
        deleterId = val.checkId(deleterId, 'deleter id');
    } catch(emsg) {
        throw [400, emsg];
    }

    const postsCollection = await posts();
    let post = await getPostById(postId);
    const post_id_to_remove = new ObjectId(postId);
    const music_id = new ObjectId(post.music_id);
    const user_id = new ObjectId(post.user_id);
    deleterId = new ObjectId(deleterId);

    if (!deleterId.equals(user_id)) {
        // console.log(user_id);
        throw [400, `Only the original poster can delete a post.`];
    }

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


    // remove comments under the post
    const commentCollection = await comments();
    for (let comment_id of post.comments){
        const updatedComment = await commentCollection.findOneAndDelete({_id: new ObjectId(comment_id)});
        if (!updatedComment)
            throw [404, `Could not delete comments on post ${postId}`];
    }

    // remove post from the likes of the users who have liked it
    for (let liker_id of post.likes){
        const updatedUserLikes = await userCollection.findOneAndUpdate(
            {_id: new ObjectId(liker_id)},
            {$pull: {likedPosts: new ObjectId(postId)}},
            {returnDocument: 'after'}
        )
        if (!updatedUserLikes)
            throw [404, `Could not remove post from other users' likes`];
    }

    const deletionInfo = await postsCollection.findOneAndDelete({
        _id: new ObjectId(postId)
    });


    if (!deletionInfo) {
        throw [404, `Could not delete post with id of ${postId}`];
    }

    return {deleted: true};
}


/**
 * the only thing that can be updated on a post is the array of likes it has
 * @param postId the id of the post to update
 * @param liker_id the id of the person who liked the post
 * @returns {Promise<*>}
 */
export const likePost = async (
    postId,
    liker_id
) => {

    try {
        postId = val.checkId(postId, 'post id');
        liker_id = val.checkId(liker_id, 'liker id');
    } catch(emsg) {
        throw [400, emsg];
    }

    const postsCollection = await posts();

    const updatedInfo = await postsCollection.findOneAndUpdate(
        {_id: new ObjectId(postId)},
        {$push: {likes: new ObjectId(liker_id)}},
        {returnDocument: 'after'}
    );

    if (!updatedInfo) {
        throw [404, 'Could not update post successfully'];
    }

    const userCollection  = await users();
    const userUpdatedInfo = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(liker_id)},
        {$push: {likedPosts: new ObjectId(postId)}},
        {returnDocument: 'after'}
    );

    if (!userUpdatedInfo)
        throw [404, 'Could not like post successfully!'];

    return updatedInfo
}

export const unlikePost = async (postId, unlikerId) => {

    try {
        postId = val.checkId(postId, 'post id');
        unlikerId = val.checkId(unlikerId, 'unliker id');
    } catch(emsg) {
        throw [400, emsg];
    }

    const postsCollection = await posts();

    const updatedInfo = await postsCollection.findOneAndUpdate(
        {_id: new ObjectId(postId)},
        {$pull: {likes: new ObjectId(unlikerId)}},
        {returnDocument: 'after'}
    );

    if (!updatedInfo) {
        throw [404, 'Could not update post successfully'];
    }

    const userCollection  = await users();
    const userUpdatedInfo = await userCollection.findOneAndUpdate(
        {_id: new ObjectId(unlikerId)},
        {$pull: {likedPosts: new ObjectId(postId)}},
        {returnDocument: 'after'}
    );

    if (!userUpdatedInfo)
        throw [404, 'Could not like post successfully!'];

    return updatedInfo
}

export const editPostContent = async (postId, newRating, newContent) => {
    postId = val.checkId(postId);
    newRating = val.checkRating(newRating, "post rating");
    newContent = val.checkString(newContent, "post content");

    const postCollection = await posts();
    // const originalPost = postCollection.findOne({_id: new ObjectId(postId)});

    const updatedInfo = await postCollection.findOneAndUpdate(
        {_id: new ObjectId(postId)},
        {$set: {rating: newRating, content: newContent}},
        {returnDocument: 'after'}
    );

    if (!updatedInfo)
        throw [404, 'Could not edit post successfully!'];

    return updatedInfo;
}

export const getCommentDetailsFromPost = async (postId) => {
    postId = val.checkId(postId, 'post id');

    const postCollection = await posts();

    const commentDetails = await postCollection.aggregate([
        {
            '$match': {
                '_id': new ObjectId(postId)
            }
        }, {
            '$unwind': '$comments'
        }, {
            '$project': {
                '_id': 0,
                'comments': 1
            }
        }, {
            '$lookup': {
                'from': 'comments',
                'localField': 'comments',
                'foreignField': '_id',
                'as': 'commentDetails'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$arrayElemAt': [
                        '$commentDetails', 0
                    ]
                }
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
                }
            }
        }, {
            '$project': {
                'userInfo': 0
            }
        }
    ]).toArray();
    if (!commentDetails)
        throw `Could not get comments for post with id ${postId}`;
    return commentDetails;
}


// console.log(await getCommentDetailsFromPost('657a270512ba1278581f8902'));
// console.log(await getAllPosts());
// console.log(await getCommentDetailsFromPost('657a270512ba1278581f88fb'));

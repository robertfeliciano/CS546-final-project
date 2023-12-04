import {songs} from '../config/mongoCollections.js';
import {getByTitle as getAlbum, update as updateAlbum} from './albums.js'
import {ObjectId} from 'mongodb';

export const createSong = async (
    title,
    artist,
    album,
    genre,
    release,
    total_stars,
    total_ratings,
    posts
) => {

    //input validation

    let newSong = {
        title:title,
        artist:artist,
        album:album,
        genre:genre,
        release:release,
        total_stars:total_stars,
        total_ratings:total_ratings,
        avg_rating:(total_stars/total_ratings).toFixed(1),
        posts:posts
    }

    const songCollection = await songs()
    const insertInfo = await songCollection.insertOne(newSong)
    
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add song!'
    }

    const newId = insertInfo.insertedId.toString()
    const new_song = await get(newId)
    
    return new_song
}

export const getAll = async () => {
    const songCollection = await songs()
    
    let songList = await songCollection
        .find({})
        .project({_id : 1, title:1})
        .toArray()
    
    if (!songList) {
        throw 'Could not get all songs'
    }

    return songList
}

export const get = async (songId) => {
    
    //input validation

    const songCollection = await songs()
    const song = await songCollection.findOne({_id: new ObjectId(songId)})

    if (song === null) {
        throw 'No song with that id'
    }

    return song
}

export const remove = async (songId) => {

    //input validation 

    const songCollection = await songs()
    let song = await get(songId)
    let song_title = song['title']
    
    const deletionInfo = await songCollection.findOneAndDelete({
        _id: new ObjectId(songId)
    })
    
    if (!deletionInfo) {
        throw [404, `Could not delete song with id of ${songId}`]
    }

    return {title: song_title, deleted: true}
}

//'update' assumes only the new stars from the post are passed into the function

export const update = async (
    songId,
    stars,
    postId
) => {

    //input validation 

    const songCollection = await songs()
    const curr_song = await get(songId)
    curr_song.posts.push(postId)
    const updatedSong = {
        total_stars:curr_song.total_stars+stars,
        total_ratings:curr_song.total_ratings+1,
        avg_rating:((curr_song.total_stars+stars)/(curr_song.total_ratings+1)).toFixed(1),
        posts:curr_song.posts
    }

    const updatedInfo = await songCollection.updateOne(
        {_id: new ObjectId(songId)},
        {$set: updatedSong},
        {returnDocument: 'after'}
    )

    if (!updatedInfo) {
        throw [404, 'Could not update song successfully']
    }

    let S = await get(songId)
    const album = await getAlbum(S.album)

    const albumUpdatedInfo = await updateAlbum(album._id)

    return updatedInfo
}
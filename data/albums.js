import {albums} from '../config/mongoCollections.js';
import {get as getSong} from './songs.js'
import { getAll as getAllPosts } from './posts.js';
import {ObjectId} from 'mongodb';
import * as validation from '../validation.js;'

export const createAlbum = async (
    title,
    artist,
    genre,
    release,
    songs,
    top_posts
) => {

    //input validation

    const albumSongs = []
    for (let s of songs) {
        albumSongs.push(getSong(s));
    }

    let avg_ratings = []

    for (let song of albumSongs) {
        avg_ratings.push(song.avg_rating);
    }

    const averageRating = avg_ratings.reduce((sum, rating) => sum + rating, 0) / avg_ratings.length;

    let newAlbum = {
        title:title,
        artist:artist,
        genre:genre,
        release:release,
        songs:songs,
        avg_song_rating:averageRating,
        top_posts:top_posts
    };

    const albumCollection = await albums();
    const insertInfo = await albumCollection.insertOne(newAlbum);
    
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw 'Could not add song!';
    }

    const newId = insertInfo.insertedId.toString();
    const new_album = await get(newId);
    
    return new_album;
}

export const getAll = async () => {
    const albumCollection = await albums();
    
    let albumList = await albumCollection
        .find({})
        .project({_id : 1, title:1})
        .toArray();
    
    if (!albumList) {
        throw 'Could not get all albums';
    }

    return albumList;
}

export const get = async (albumId) => {
    
    //input validation

    const albumCollection = await albums();
    const album = await albumCollection.findOne({_id: new ObjectId(albumId)});

    if (album === null) {
        throw 'No album with that id';
    }

    return album;
}

export const getByTitle = async (albumTitle) => {
    
    //input validation

    const albumCollection = await albums();
    const album = await albumCollection.findOne({title: albumTitle});

    if (album === null) {
        throw 'No album with that title';
    }

    return album;
}

export const remove = async (albumId) => {

    //input validation 

    const albumCollection = await albums();
    let album = await get(albumId);
    let album_title = album['title'];
    
    const deletionInfo = await albumCollection.findOneAndDelete({
        _id: new ObjectId(albumId)
    });
    
    if (!deletionInfo) {
        throw [404, `Could not delete album with id of ${albumId}`];
    }

    return {title: album_title, deleted: true};
}

export const update = async (
    albumId
) => {

    //input validation 

    const the_album = await get(albumId);
    const songs = the_album.songs;
    
    const albumSongs = [];
    for (let s of songs) {
        albumSongs.push(await getSong(s));
    }

    let avg_ratings = [];

    for (let song of albumSongs) {
        avg_ratings.push(song.avg_rating);
    }

    avg_ratings = avg_ratings.map(Number);
    const sum = avg_ratings.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const averageRating = sum / avg_ratings.length;

    let all_album_posts = await getAllPosts();

    all_album_posts = all_album_posts.filter(p => {
        if (songs.map(String).includes(p.song_id.toString())) {
            return p;
        }
    })

    const sorted = all_album_posts.sort((a,b) => b.likes.length - a.likes.length);
    const topThree = sorted.slice(0,3).map(p => p._id);


    const albumCollection = await albums();
    const updatedAlbum = {
        avg_song_rating:averageRating,
        top_posts:topThree
    };

    const updatedInfo = await albumCollection.updateOne(
        {_id: new ObjectId(albumId)},
        {$set: updatedAlbum},
        {returnDocument: 'after'}
    );

    if (!updatedInfo) {
        throw [404, 'Could not update album successfully'];
    }

    return updatedInfo;
}
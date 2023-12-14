import {music} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';
import Fuse from 'fuse.js';
import * as val from '../validation.js';
import {checkType} from "../validation.js";

//input validation

/**
 * insert new music into db
 * @param type
 * @param name
 * @param artist
 * @param genre
 * @param songs
 * @returns {Promise<*>}
 */
export const insertMusic = async (
    type,
    name,
    artist,
    genre,
    songs
) => {

  type = val.checkType(type);
  name = val.checkName(name, 'name');
  artist = val.checkName(artist, 'artist');
  genre = val.checkGenre(genre);
  if (!Array.isArray(songs))
    throw `Songs must be an array`;

  let newMusic = {
    type: type,
    name: name,
    artist: artist,
    genre: genre,
    total_stars: 0,
    total_ratings: 0,
    posts: [],
    songs: songs // songs array is only empty if type === 'album'
  };

  const musicCollection = await music();
  const insertInfo = await musicCollection.insertOne(newMusic);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw `Could not add music to database!`;

  if (type === 'song') {
    const music_id = insertInfo.insertedId.toString();
    const new_music = await getTypeMusicById("song", music_id);
    return new_music;
  }
  else { // type is album
    const music_id = insertInfo.insertedId.toString();
    const new_music = await getTypeMusicById("album", music_id);
    return new_music;
  }

}

/**
 * find either albums or songs
 * @param find_type
 * @returns {Promise<void>}
 */
const getMusicOfType = async (find_type) => {
  find_type = checkType(find_type);
  const musicCollection = await music();
  const song_list = await musicCollection.find(
      {type: find_type}
  ).toArray();
  if (!song_list)
    throw `Could not find music of type ${find_type}`;
  return song_list;
}

export const getAllSongs = async () => {
  const song_list = await getMusicOfType("song");
  return song_list;
}

export const getAllAlbums = async () => {
  const song_list = await getMusicOfType("album");
  return song_list;
}

export const getAllMusic = async () => {
  const musicCollection = await music();
  const music_found = await musicCollection.find(
      {},
      {posts: 0}
  ).toArray();
  return music_found;
}

const getTypeMusicById = async (of_type, music_id) => {

  of_type = val.checkType(of_type);
  music_id = val.checkId(music_id, 'music id');

  const musicCollection = await music();
  const song_found = await musicCollection.findOne({
    type: of_type,
    _id: new ObjectId(music_id)
  });
  if (!song_found)
    throw `Could not find songs of type ${of_type}`;
  return song_found;
}

export const getSongById = async (song_id) => {
  song_id = val.checkId(song_id, 'song id');
  const song_found = await getTypeMusicById("song", song_id);
  return song_found;
}

export const getAlbumById = async (album_id) => {
  album_id = val.checkId(album_id, 'album id');
  const album_found = await getTypeMusicById("album", album_id);
  return album_found;
}

export const getMusicById = async (music_id) => {
  music_id = val.checkId(music_id, 'music id');
  const musicCollection = await music();
  const music_found = await musicCollection.findOne({
    _id: new ObjectId(music_id)
  });
  return music_found;
}

export const fuzzyFindMusic = async (query) => {

  query = val.checkName(query, 'search query');

  const albums = await getAllAlbums();
  const songs = await getAllSongs();
  const piece_options = {
    keys: ['name'], threshold: 0.45
  };
  const fuse_albums = new Fuse(
      albums, piece_options
  );
  const fuse_songs = new Fuse(
      songs, piece_options
  );
  const albums_found = fuse_albums.search(query);
  const songs_found = fuse_songs.search(query);

  return [
      albums_found.map(obj => obj.item),
      songs_found.map(obj => obj.item)];
}

export const getSongsFromAlbum = async (albumId) => {
  albumId = val.checkId(albumId, 'album id');

  const albums = await music();
  const albumSongs = await albums.aggregate([
    { $match: { _id: new ObjectId(albumId) } },
    { $unwind: '$songs' },
    { $project: { _id: 0, songs: 1 } },
    { $lookup: {
            from: 'music',
            localField: 'songs',
            foreignField: '_id',
            as: 'songDetails'
      }
    },
    { $replaceRoot: {
        newRoot: { $arrayElemAt: ['$songDetails', 0 ] }
      }
    }]).toArray();
  if (!albumSongs)
    throw `Could not get songs for album with id ${albumId}`;
  return albumSongs;
}
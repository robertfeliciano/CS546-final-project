import {music} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

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
    const new_music = await getMusicById("song", music_id);
    return new_music;
  }
  else { // type is album
    const music_id = insertInfo.insertedId.toString();
    const new_music = await getMusicById("album", music_id);
    return new_music;
  }

}

/**
 * find either albums or songs
 * @param find_type
 * @returns {Promise<void>}
 */
const getMusicOfType = async (find_type) => {
  const musicCollection = await music();
  const song_list = await musicCollection.find(
      {type: find_type}
  ).toArray();
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

const getMusicById = async (of_type, music_id) => {
  const musicCollection = await music();
  const song_found = await musicCollection.findOne({
    type: of_type,
    _id: new ObjectId(music_id)
  });
  return song_found;
}

export const getSongById = async (song_id) => {
  const song_found = getMusicById("song", song_id);
  return song_found;
}

export const getAlbumById = async (album_id) => {
  const album_found = getMusicById("song", album_id);
  return album_found;
}

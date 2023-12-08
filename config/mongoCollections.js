import { dbConnection } from './mongoConnection.js';

const getCollectionFn = (collection) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }

    return _col;
  };
};

export const users = getCollectionFn('users');
// export const albums = getCollectionFn('albums');
// export const songs = getCollectionFn('songs');
export const posts = getCollectionFn('posts');
export const comments = getCollectionFn('comments');
export const music = getCollectionFn('music')
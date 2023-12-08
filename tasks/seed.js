import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import {users} from './seed_users.js';
import {MBDTF_songs, Grad_songs, MBDTF, Graduation} from './seed_music.js'
import {usersData, musicData, postsData, commentsData} from '../data/index.js';
import {song_posts, album_posts} from './seed_posts.js'

const db = await dbConnection();
await db.dropDatabase();


const main = async () => {
  let userIds = [];
  const start = Date.now();

  console.log("Seeding users...");
  for (let user of users) {
    const newuser = await usersData.createUser(
        user.username,
        user.email,
        user.password,
        user.bio,
        user.profilePicture
    );
    userIds.push(newuser._id);
  }

  console.log("Seeding songs...");
  let MBDTF_ids = [];
  for (let song of MBDTF_songs) {
    const s = await musicData.insertMusic(
        "song",
        song.name,
        song.artist,
        song.genre,
        []
    );
    MBDTF_ids.push(s._id);
  }

  let Grad_ids = [];
  for (let song of Grad_songs) {
    const s = await musicData.insertMusic(
        "song",
        song.name,
        song.artist,
        song.genre,
        []
    );
    Grad_ids.push(s._id);
  }

  console.log("Seeding albums...");

  let mbdtf_inserted = await musicData.insertMusic(
      "album",
      MBDTF.name,
      MBDTF.artist,
      MBDTF.genre,
      MBDTF_ids
  );

  let grad_inserted = await musicData.insertMusic(
      "album",
      Graduation.name,
      Graduation.artist,
      Graduation.genre,
      Grad_ids
  );

  console.log("Seeding posts...");
  let post_ids = [];
  const date = new Date().toLocaleDateString();
  for (let [idx, song_id] of MBDTF_ids.entries()) {
    const user_id = userIds[Math.floor(Math.random() * userIds.length)];
    const post = song_posts[idx];
    const created_post = await postsData.createPost(
        song_id,
        post.rating,
        user_id,
        post.content,
        date
    );
    post_ids.push(created_post._id);
  }
  for (let [idx, song_id] of Grad_ids.entries()) {
    const user_id = userIds[Math.floor(Math.random() * userIds.length)];
    const post = song_posts[idx];
    const created_post = await postsData.createPost(
        song_id,
        post.rating,
        user_id,
        post.content,
        date
    );
    post_ids.push(created_post._id);
  }



  await closeConnection();
  console.log('Done!');
  console.log(`Completed seeding in ${(Date.now() - start) / 1000}s`);
};

main();

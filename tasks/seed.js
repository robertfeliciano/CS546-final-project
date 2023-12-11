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

  // let _iflashlantern = await usersData.createUser(
  //     'iflashlantern',
  //     'rfelici1@stevens.edu',
  //     'Epicpassword!!123',
  //     "Just a short bio, sweet like a short song!",
  //     "happy_cat.jpg"
  // );

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
  const date = new Date();
  try {
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
  } catch(e) { console.log(e); return; }
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

  console.log("Seeding comments...");
  for (let post_id of post_ids) {
    const user_id = userIds[Math.floor(Math.random() * userIds.length)];
    const possible_comments = ["I agree!", "I dont agree", "Have you tried reading a book?", "Yes!"];
    const cmnt_idx = Math.floor(Math.random() * possible_comments.length);
    const created_cmnt = await commentsData.createComment(
        post_id,
        user_id,
        possible_comments[cmnt_idx],
        date
    );
  }

  console.log("Seeding followers...");
  for (let i = 1; i < userIds.length; i++){
    let _ = await usersData.addFollower(userIds[i], userIds[i-1]);
  }

  console.log("Seeding following...");
  for (let i  = 0; i < userIds.length - 1; i++) {
    let _ = await usersData.addFollower(userIds[i], userIds[i+1]);
  }

  console.log("Seeding likes...");
  for (let post_id of post_ids) {
    const user_id = userIds[Math.floor(Math.random() * userIds.length)];
    let _ = await postsData.likePost(post_id, user_id);
  }

  await closeConnection();
  console.log('Done!');
  console.log(`Finished seeding in ${(Date.now() - start) / 1000}s`);
};

await main();

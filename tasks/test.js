import {usersData, postsData, commentsData, musicData} from '../data/index.js';
import {dbConnection, closeConnection} from '../config/mongoConnection.js';

await dbConnection();
try {
  const exampleuser = await usersData.getUserByName('gamerpro99');
  const fulluserdata = await usersData.getUserById(exampleuser._id)
  console.log(fulluserdata.userPosts);

  const del = await usersData.removeUser(exampleuser._id);

  if (del.deleted)
    console.log(`${exampleuser.username} removed successfully.`);

} catch(e) {
  console.log(e);
}

try {
  const songs = await musicData.getAllSongs()
  // console.log('hiiii');
  // console.log(albums[0]._id.toString());
  const somesong = songs[0]._id.toString();
  const examplemusic = await musicData.getSongById(somesong);
  console.log(examplemusic);
  const darkfantasy_posts = await postsData.getAllPostsFromMusicId(examplemusic._id);
  console.log(darkfantasy_posts);
} catch(e) {
  console.log(e)
}

try {
  const exampleuser = await usersData.getUserByName('user1');
  const examplefollowingposts = await postsData.getAllPostsFromFollowing(exampleuser._id);
  console.log(examplefollowingposts);
} catch (e) {
  console.log(e);
}

await closeConnection();
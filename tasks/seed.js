import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import {usersData, albumsData, songsData, postsData, commentsData} from '../data/index.js';

const db = await dbConnection();
await db.dropDatabase();

import {users} from './seed_users.js';
import {createUser} from "../data/users.js";

let userIds = [];

for (let user of users) {
  const userId  = await createUser(
      user.username,
      user.email,
      user.password,
      user.userPosts,
      user.userComments,
      user.friends,
      user.bio,
      user.profilePicture
  );
  userIds.push(userId);
}




console.log(users);


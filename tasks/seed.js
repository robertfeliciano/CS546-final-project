import {dbConnection, closeConnection} from '../config/mongoConnection.js';
import {usersData, albumsData, songsData, postsData, commentsData} from '../data/index.js';

const db = await dbConnection();
await db.dropDatabase();

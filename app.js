import {dbConnection, closeConnection} from './config/mongoConnection.js';
import {usersData, albumsData, songsData, postsData, commentsData} from './data/index.js';

const db = await dbConnection();
await db.dropDatabase();

//testing users

// let user1 = undefined;
// let user2 = undefined;
// let user3 = undefined;

// try {
//     user1 = await usersData.createUser("tsoiferm","tsoiferm@stevens.edu","8798",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6510","7b696a2-d0f2-4g8g-h67d-7a1d4b6b6910"],["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6510","7b696a2-d0f2-4g8g-h67d-7a1d4b6b611"],["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6428"],"Hi, I'm Tyler","happy_cat.jpg");
// } catch (e) {
//     console.log(e)
// }

// try {
//     user2 = await usersData.createUser("jsoiferm","jsoiferm@stevens.edu","8798",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6511","7b696a2-d0f2-4g8g-h67d-7a1d4b6b6912"],["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6513","7b696a2-d0f2-4g8g-h67d-7a1d4b6b614"],["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6429"],"Hi, I'm Jared","happy_dog.jpg");
// } catch (e) {
//     console.log(e)
// }

// try {
//     user3 = await usersData.createUser("dsoiferm","dsoiferm@stevens.edu","8798",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6519","7b696a2-d0f2-4g8g-h67d-7a1d4b6b6918"],["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6517","7b696a2-d0f2-4g8g-h67d-7a1d4b6b616"],["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6425"],"Hi, I'm D","happy_duck.jpg");
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await usersData.getAll())
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await usersData.get(user2._id))
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await usersData.remove(user3._id))
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await usersData.updatePut(user1._id,"1234512evcw34tgfdsaqasdc","cvbhyt43wsxcvgy76543wsdfgbv","23erfghju765rfdswerfghyre"))
// } catch (e) {
//     console.log(e)
// }

//testing comments

// let comment1 = undefined
// let comment2 = undefined
// let comment3 = undefined

// try {
//     comment1 = await commentsData.createComment("b7997a2-c0d2-4f8c-b27a-5a2d4n8b5317","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6310","This song is with the sauce like that.","11/30/2023");
// } catch (e) {
//     console.log(e)
// }

// try {
//     comment2 = await commentsData.createComment("b7997a2-c0d2-4f8c-b27a-5a2d4n8b5318","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6311","This song is cool.","03/30/2019");
// } catch (e) {
//     console.log(e)
// }

// try {
//     comment3 = await commentsData.createComment("b7997a2-c0d2-4f8c-b27a-5a2d4n8b5319","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6312","This song is dope.","04/30/2017");
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await commentsData.getAll())
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await commentsData.get(comment2._id))
// } catch (e) {
//     console.log(e)
// }

// try {
//     console.log(await commentsData.remove(comment3._id))
// } catch (e) {
//     console.log(e)
// }

//testing posts

let post1 = undefined
let post2 = undefined
let post3 = undefined
let post4 = undefined

//testing albums

let album1 = undefined
let album2 = undefined
let album3 = undefined


//testing songs

let song1 = undefined
let song2 = undefined
let song3 = undefined

try {
    song1 = await songsData.createSong("Africa","Toto","Toto IV","pop","06/07/1982",1000,200,["b7997a2-c0d2-4f8c-b27a-5a2d4n8b5317","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6310"]);
} catch (e) {
    console.log(e)
}

try {
    song2 = await songsData.createSong("The Scientist","Coldplay","Rush of Blood to the Head","rock","07/07/2005",2000,300,["b7997a2-c0d2-4f8c-b27a-5a2d4n8b5318","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6319"]);
} catch (e) {
    console.log(e)
}

try {
    song3 = await songsData.createSong("In My Place","Coldplay","Rush of Blood to the Head","rock","07/07/2005",10000,500,["b7997a2-c0d2-4f8c-b27a-5a2d4n8b5376","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6990"]);
} catch (e) {
    console.log(e)
}

try {
    post1 = await postsData.createPost(song2._id,5,"7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6310","This song is with the sauce like that.","11/30/2023",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6428","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6429","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6431"]);
} catch (e) {
    console.log(e)
}

try {
    post2 = await postsData.createPost(song2._id,4.5,"7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6312","This song is with the sauce like that on jah.","2/12/2020",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6428","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6429","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6431","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6431","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6431"]);
} catch (e) {
    console.log(e)
}

try {
    post3 = await postsData.createPost(song3._id,4,"7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6311","This song is with the sauce like that sort of but yea.","12/30/2020",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6428","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6429","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430"]);
} catch (e) {
    console.log(e)
}

try {
    post4 = await postsData.createPost(song1._id,3,"7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6311","This song is not with the sauce like that fr.","02/09/2020",["7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6428","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6429","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430","7b7997a2-c0d2-4f8c-b27a-6a1d4b5b6430"]);
} catch (e) {
    console.log(e)
}

try {
    album1 = await albumsData.createAlbum("Rush of Blood to the Head","Coldplay","rock","07/07/2005",[song2._id,song3._id],["ooogabooga","blahblahblah",""]);
} catch (e) {
    console.log(e)
}

try {
    console.log(await albumsData.getAll());
} catch (e) {
    console.log(e)
}

try {
    console.log(await albumsData.get(album1._id));
} catch (e) {
    console.log(e)
}


try {
    console.log(await albumsData.getByTitle("Rush of Blood to the Head"));
} catch (e) {
    console.log(e)
}

try {
    let info = await albumsData.update(album1._id);
    console.log("Updated Album (should have proper top posts):")
    console.log(await albumsData.get(album1._id))
} catch (e) {
    console.log(e)
}

try {
    console.log(await songsData.getAll())
} catch (e) {
    console.log(e)
}

try {
    console.log(await songsData.get(song2._id))
} catch (e) {
    console.log(e)
}

try {
    console.log(await songsData.remove(song1._id))
} catch (e) {
    console.log(e)
}

try {
    console.log("Originals:")
    console.log(await songsData.get(song3._id))
    console.log(await albumsData.get(album1._id))
    console.log(await songsData.update(song3._id,500,"234rtgt53wsdx234rtghy65rds"))
    console.log("Updated:")
    console.log(await songsData.get(song3._id))
    console.log(await albumsData.get(album1._id))
} catch (e) {
    console.log(e)
}


await closeConnection();
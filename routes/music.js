import {Router} from 'express';
import * as val  from '../validation.js';
import {musicData, postsData, usersData} from '../data/index.js'
import {fromPostman} from "../helpers.js";
const router = Router();
import xss from 'xss';
import {ObjectId} from "mongodb";

router
    .route('/')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      try {
        const all_music = await musicData.getAllMusic();
        if (fromPostman(req.headers['user-agent']))
          return res.json({music: all_music});
        return res.render('music/musicList', {userInfo: req.session.user, music: all_music});
      } catch(e) {
        return res.status(500).render('error/error', {userInfo: req.session.user, problem: e, link:'/home'})
      }
    });

router
    .route('/songs')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      try {
        const all_songs = await musicData.getAllSongs();
        if (fromPostman(req.headers['user-agent']))
          return res.json({songs: all_songs});
        return res.render('music/musicList', {userInfo: req.session.user, music: all_songs});
      } catch(e) {
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", problem: e, link:`/music/`});
      }
    });


router
    .route('/albums')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      try {
        const all_albums = await musicData.getAllAlbums();
        if (fromPostman(req.headers['user-agent']))
          return res.json({music: all_albums});
        return res.render('music/musicList', {userInfo: req.session.user, music: all_albums});
      } catch (e) {
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", problem: e, link:`/music/`});
      }
    });

router
    .route('/recommendations')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      try {
        const musicRecs = await usersData.getRecommendations(req.session.user._id);
        if (fromPostman(req.headers['user-agent']))
          return res.json({musicRecs: musicRecs});
        return res.render('music/recommendations', {userInfo: req.session.user, music: musicRecs});
      } catch(e) {
        return res.status(500).render('error/error', {userInfo: req.session.user, error: 'Internal Server Error', problem: e,
          link: '/home'});
      }
    });

router
    .route('/search')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      let query = req.query.piece;
      query = val.checkName(query, 'search query');
      // albums and songs could potentially be empty, thats fine
      // we just want to display nothing then.
      const [albums, songs] = await musicData.fuzzyFindMusic(query);
      let albumsEmpty =  false, songsEmpty = false;
      if (albums.length === 0)
        albumsEmpty = true;
      if (songs.length === 0)
        songsEmpty = true;
      if (fromPostman(req.headers['user-agent']))
        return res.json({
          userInfo: req.session.user,
          albums: albums,
          songs: songs,
          albumsEmpty,
          songsEmpty,
          query: query
        });
      return res.render('music/searchResult', {
        userInfo: req.session.user,
        albums: albums,
        songs: songs,
        albumsEmpty,
        songsEmpty,
        query: query
      });
    });

router
    .route('/:id')
    .get(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      try {
        req.params.id = val.checkId(req.params.id, "music id");
      } catch(e) {
        return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/music/`});
      }
      try {
        const piece = await musicData.getMusicById(req.params.id);
        let avg = piece.total_stars/piece.total_ratings;
        if (isNaN(avg)) avg = "Not rated yet!";
        const musicPosts = await musicData.getPostsForMusic(req.params.id)
        const meta = {
          id: piece._id,
          name: piece.name,
          type: piece.type,
          posts: musicPosts,
          avg: avg,
          genre: piece.genre,
          artist: piece.artist,
          songs: piece.songs
        };
        if (fromPostman(req.headers['user-agent']))
          return res.json({
            userInfo: req.session.user,
            musicInfo: meta});
        return res.render('music/musicPiece', {
          userInfo: req.session.user,
          musicInfo: meta});
      } catch(e) {
        return res.status(500).render("error/error",{
          userInfo: req.session.user,
          error: `No piece with id ${req.params.id} found`,
          link:`/music/`});
      }
    })
    .post(async (req, res) => {
      req.session.user._id = new ObjectId(req.session.user._id);
      // create a post for the song with the id in the url
      try{
        req.params.id = val.checkId(req.params.id, "music id");
      } catch(e) {
        return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/music/`});
      }
      for (let key of Object.keys(req.body)) {
        req.body[key] = xss(req.body[key])
      }
      let formInput = req.body;
      if (!formInput)
        return res.status(400).render("error/error",{userInfo: req.session.user, error: "Must provide form input.", link:`/music/${req.params.id}`});
      let missingFields = [];
      if (!formInput.rating)
        missingFields.push('Rating');
      if (!formInput.content)
        missingFields.push('Post content');
      if (missingFields.length > 0) {
        if (fromPostman(req.headers['user-agent']))
          return res.status(400).json({userInfo: req.session.user, error: `Missing Field(s): ${missingFields.toString()}`, link:`/music/${req.params.id}`});
        else
          return res.status(400).render("error/error",{userInfo: req.session.user, error: `Missing Field(s): ${missingFields.toString()}`, link:`/music/${req.params.id}`});
      }
      try {
        formInput.rating = val.checkRating(formInput.rating, 'Music rating');
        formInput.content = val.checkString(formInput.content, 'Post content');
      } catch(e) {
        if (fromPostman(req.headers['user-agent']))
          return res.status(400).json({userInfo: req.session.user, error: e, link:`/music/${req.params.id}`});
        else
          return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/music/${req.params.id}`});
      }
      try {
        const alreadyPosted = await postsData.userAlreadyPosted(req.params.id, req.session.user._id);
        if (alreadyPosted)
          throw [409, `User ${req.session.user._id} has already posted under ${req.params.id}`];
      } catch(e) {
        return res.status(e[0]).render('error/error', {userInfo: req.session.user, error: e[1], link: `/music/${req.params.id}`});
      }
      try {
        const date = new Date();
        const inserted = await postsData.createPost(
            req.params.id,
            formInput.rating,
            req.session.user._id,
            formInput.content,
            date
        );
        const piece = await musicData.getMusicById(req.params.id);
        inserted['avg'] = piece.total_stars/piece.total_ratings;
        if (inserted) {
          if (fromPostman(req.headers['user-agent']))
            return res.json(inserted);
          else
            return res.json(inserted);
        }
        else {
          throw `Did not insert into db...`
        }
      } catch(e) {
        return res.status(500).render("error/error",{userInfo: req.session.user, error: "Internal Server Error", link:`/music/${req.params.id}`});
      }
    });

export default router;
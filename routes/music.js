import {Router} from 'express';
import * as val  from '../validation.js';
import {musicData, postsData} from '../data/index.js'
import {fromPostman} from "../helpers.js";
const router = Router();
import xss from 'xss';

router
    .route('/')
    .get(async (req, res) => {
      try {
        const all_music = await musicData.getAllMusic();
        if (fromPostman(req.headers['user-agent']))
          return res.json({music: all_music});
        return res.render('music/musicList', {userInfo: req.session.user, music: all_music});
      } catch(e) {
        return res.status(500).json({error: "Internal Server Error", problem: e});
      }
    });

router
    .route('/songs')
    .get(async (req, res) => {
      try {
        const all_songs = await musicData.getAllSongs();
        if (fromPostman(req.headers['user-agent']))
          return res.json({songs: all_songs});
        return res.render('music/musicList', {userInfo: req.session.user, music: all_songs});
      } catch(e) {
        return res.status(500).render("error",{userInfo: req.session.user, error: "Internal Server Error", problem: e, link:`/music/`});
      }
    });


router
    .route('/albums')
    .get(async (req, res) => {
      try {
        const all_albums = await musicData.getAllAlbums();
        if (fromPostman(req.headers['user-agent']))
          return res.json({music: all_albums});
        return res.render('music/musicList', {userInfo: req.session.user, music: all_albums});
      } catch (e) {
        return res.status(500).render("error",{userInfo: req.session.user, error: "Internal Server Error", problem: e, link:`/music/`});
      }
    });

router
    .route('/recommendations')
    .get(async (req, res) => {
      return res.json({msg: "not implemented yet!"});
    });

router
    .route('/search')
    .get(async (req, res) => {
      /**
       * TODO: FRONT END TEAM
       * upon submitting something to a search bar
       * the action should be /music/search?piece=nameofpiece
       * with method GET
       * Also...
       * When the user inputs something into a search bar,
       * for example: "The life of pablo"
       * replace spaces with %20
       * so: "The%20life%20of%20pablo"
       */
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
          songsEmpty
        });
      return res.render('music/searchResult', {
        userInfo: req.session.user,
        albums: albums,
        songs: songs,
        albumsEmpty,
        songsEmpty
      });
    });

router
    .route('/:id')
    .get(async (req, res) => {
      try {
        req.params.id = val.checkId(req.params.id, "music id");
      } catch(e) {
        return res.status(400).render("error",{userInfo: req.session.user, error: e, link:`/music/`});
      }
      try {
        const piece = await musicData.getMusicById(req.params.id);
        const avg = piece.total_stars/piece.total_ratings;
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
        return res.status(500).render("error",{
          userInfo: req.session.user,
          error: `No piece with id ${req.params.id} found`,
          link:`/music/`});
      }
    })
    .post(async (req, res) => {
      // create a post for the song with the id in the url
      try{
        req.params.id = val.checkId(req.params.id, "music id");
      } catch(e) {
        return res.status(400).render("error",{userInfo: req.session.user, error: e, link:`/music/`});
      }
      for (let key of Object.keys(req.body)) {
        req.body[key] = xss(req.body[key])
      }
      let formInput = req.body;
      if (!formInput)
        return res.status(400).render("error",{userInfo: req.session.user, error: "Must provide form input.", link:`/music/${req.params.id}`});
      let missingFields = [];
      if (!formInput.rating)
        missingFields.push('Rating');
      if (!formInput.content)
        missingFields.push('Post content');
      if (missingFields.length > 0) {
        if (fromPostman(req.headers['user-agent']))
          return res.status(400).json({userInfo: req.session.user, error: `Missing Field(s): ${missingFields.toString()}`, link:`/music/${req.params.id}`});
        else
          return res.status(400).render("error",{userInfo: req.session.user, error: `Missing Field(s): ${missingFields.toString()}`, link:`/music/${req.params.id}`});
      }
      try {
        formInput.rating = val.checkRating(formInput.rating, 'Music rating');
        formInput.content = val.checkString(formInput.content, 'Post content');
      } catch(e) {
        if (fromPostman(req.headers['user-agent']))
          return res.status(400).json({userInfo: req.session.user, error: e, link:`/music/${req.params.id}`});
        else
          return res.status(400).render("error",{userInfo: req.session.user, error: e, link:`/music/${req.params.id}`});
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
        if (inserted) {
          if (fromPostman(req.headers['user-agent']))
            return res.json(inserted);
          else
            return res.redirect(`/music/${req.params.id}`);
        }
      } catch(e) {
        return res.status(500).render("error",{userInfo: req.session.user, error: "Internal Server Error", link:`/music/${req.params.id}`});
      }
    });

export default router;
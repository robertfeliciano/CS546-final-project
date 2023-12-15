import {Router} from 'express';
import * as val  from '../validation.js';
import {musicData, postsData} from '../data/index.js'
import {fromPostman} from "../helpers.js";
const router = Router();

router
    .route('/')
    .get(async (req, res) => {
      try {
        const all_music = await musicData.getAllMusic();
        if (fromPostman(req.headers['user-agent']))
          return res.json({music: all_music});
        return res.render('music', {music: all_music});
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
        return res.render('music', {music: all_songs});
      } catch(e) {
        return res.status(500).json({error: "Internal Server Error", problem: e});
      }
    });


router
    .route('/albums')
    .get(async (req, res) => {
      try {
        const all_albums = await musicData.getAllAlbums();
        if (fromPostman(req.headers['user-agent']))
          return res.json({albums: all_albums});
        return res.render('music', {music: all_albums});
      } catch (e) {
        return res.status(500).json({error: "Internal Server Error", problem: e});
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
      if (fromPostman(req.headers['user-agent']))
        return res.json({albums: albums, songs: songs});
      return res.render('music/searchResult', {albums: albums, songs: songs});
    });

router
    .route('/:id')
    .get(async (req, res) => {
      try {
        req.params.id = val.checkId(req.params.id, "music id");
      } catch(e) {
        return res.status(400).json({error: e});
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
          return res.json(meta);
        return res.render('musicPiece', meta);
      } catch(e) {
        return res.status(500).json({error: `No piece with id ${req.params.id} found`});
      }
    })
    .post(async (req, res) => {
      // create a post for the song with the id in the url
      try{
        req.params.id = val.checkId(req.params.id, "music id");
      } catch(e) {
        return res.status(400).json({error:e});
      }
      let formInput = req.body;
      if (!formInput)
        return res.status(400).json({error:"Must provide form input."});
      let missingFields = [];
      if (!formInput.rating)
        missingFields.push('Rating');
      if (!formInput.content)
        missingFields.push('Post content');
      if (missingFields.length > 0) {
        if (fromPostman(req.headers['user-agent']))
          return res.status(400).json({error: `Missing Field(s): ${missingFields.toString()}`});
        else
          return res.status(400).json({error: `Missing Field(s): ${missingFields.toString()}`});
      }
      try {
        formInput.rating = val.checkRating(formInput.rating, 'Music rating');
        formInput.content = val.checkString(formInput.content, 'Post content');
      } catch(e) {
        if (fromPostman(req.headers['user-agent']))
          return res.status(400).json({error: e});
        else
          return res.status(400).json({error: e});
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
            return res.json(inserted);
        }
      } catch(e) {
        console.log(e);
        return res.status(500).json({error: "Internal Server Error"});
      }
    });

export default router;
import {Router} from 'express';
import * as val  from '../validation.js';
import {musicData} from '../data/index.js'
import {fromPostman} from "../helpers.js";

const router = Router();


router.
    route('/')
    .get(async (req, res) => {
        if (fromPostman(req.headers['user-agent']))
            return res.json({stuff: 'stuff'});

        console.log(req.headers['user-agent']);
    });


export default router;
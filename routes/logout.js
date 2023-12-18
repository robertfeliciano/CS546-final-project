import {Router} from 'express';

const router = Router();

router.route('/').get(async (req, res) => {
    //code here for GET
    req.session.destroy();
    return res.render('login-register/logout', {layout: 'external'});
});

export default router;
import {Router} from 'express';

const router = Router();

router.route('/').get(async (req, res) => {
    //code here for GET
    if (req.session.user) {
      req.session.destroy();
      return res.render('logout');
    } else {
        return res.redirect('/login');
    }
});

export default router;
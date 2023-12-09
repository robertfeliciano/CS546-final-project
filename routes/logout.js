import express from 'express';

const router = express.Router();

router.route('/logout').get(async (req, res) => {
    //code here for GET
    if (req.session.user) {
      req.session.destroy();
      return res.render('logout');
    } else {
        return res.redirect('/login');
    }
});
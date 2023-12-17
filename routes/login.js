import {Router} from 'express';
import {loginUser} from '../data/users.js';
import * as validation from '../validation.js';
import xss from 'xss';

const router = Router();

router
  .route('/')
  .get(async (req, res) => {
    res.render('login-register/login', {layout: 'external'});
  })
  .post(async (req, res) => {
    //code here for POST
    for (let key of Object.keys(req.body)) {
      req.body[key] = xss(req.body[key])
    }

    //let { emailAddressInput, passwordInput } = req.body;

    let formInput = req.body;

    let missingFields = [];
    if (!formInput.emailAddressInput) missingFields.push('Username');
    if (!formInput.passwordInput) missingFields.push('Email Address');

    if (missingFields.length > 0) {
      return res.status(400).render('login-register/login', {
        title: 'Login',
        hasErrors: true,
        error: `Missing field(s): ${missingFields.join(', ')}`
      });
    }
    
    try {
      formInput.emailAddressInput = val.checkEmail(formInput.emailAddressInput);
      formInput.passwordInput = val.checkPass(formInput.passwordInput);
    } catch (e) {
      return res.status(400).render("error/error",{userInfo: req.session.user, error: "Invalid username or password submission.", link:`/login/`});
    }

    try {
      const user = await loginUser(formInput.emailAddressInput, formInput.passwordInput);
      if (user) {
          req.session.user = {
              id: user._id,
              username: user.username,
              emailAddress: user.email,
              following: user.following
          };
          return res.status(200).redirect('/home');
      } else {
          return res.status(400).render("error/error",{userInfo: req.session.user, error: "Invalid username or password.", link:`/login/`});
      }
    } catch (e) {
        return res.status(400).render("error/error",{userInfo: req.session.user, error: e, link:`/login/`});
    }

  });

export default router;
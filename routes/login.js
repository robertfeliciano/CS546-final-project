import {Router} from 'express';
import {loginUser} from '../data/users.js';
import * as validation from '../validation.js';

const router = Router();

router
  .route('/')
  .get(async (req, res) => {
    res.render('login');
  })
  .post(async (req, res) => {
    //code here for POST
    let { emailAddressInput, passwordInput } = req.body;

    // Check if all fields are supplied
    
    emailAddressInput = validation.checkEmail(emailAddressInput);
    passwordInput = validation.checkPass(passwordInput);

    try {
      const user = await loginUser(emailAddressInput, passwordInput);
      if (user) {
          req.session.user = {
              id: user._id,
              username: user.username,
              emailAddress: user.email,
              following: user.following
          };
          return res.status(200).redirect('/home');
      } else {
          return res.status(400).render('login', { error: 'Invalid email address and/or password' });
      }
    } catch (e) {
        return res.status(400).render('login', { error: e });
    }

  });

export default router;
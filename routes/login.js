import {Router} from 'express';
import {loginUser} from '../data/users.js';
import * as validation from '../validation.js';

const router = Router();

router
  .route('/login')
  .get(async (req, res) => {
    res.render('login');
  })
  .post(async (req, res) => {
    //code here for POST
    const { emailAddressInput, passwordInput } = req.body;

    // Check if all fields are supplied
    const missingFields = [];
    
    if (!emailAddressInput) missingFields.push('Email Address');
    if (!passwordInput) missingFields.push('Password');

    if (missingFields.length > 0) {
        return res.status(400).render('login', { error: `Missing field(s): ${missingFields.join(', ')}` });
    }

    let check;

    try {
        check = loginValidate(emailAddressInput, passwordInput);
    }
    catch (e) {
        return res.status(400).render('login', { error: e });
    }

    if (check !== true) {
        return res.status(400).render('login', { error: check });
    }

    try {
      const user = await loginUser(emailAddressInput, passwordInput);
      if (user) {
          req.session.user = {
              username: user.username,
              emailAddress: user.email
          };
          return res.status(200).redirect('/posts');
      } else {
          return res.status(400).render('login', { error: 'Invalid email address and/or password' });
      }
    } catch (e) {
        return res.status(400).render('login', { error: e });
    }

  });

export default router;
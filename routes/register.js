import {Router} from 'express';
import {createUser} from '../data/users.js';
import * as val from '../validation.js';
import xss from 'xss';

const router = Router();

router
  .route('/')
  .get(async (req, res) => {
    res.render('login-register/register', {layout: 'external'});
  })
  .post(async (req, res) => {
    for (let key of Object.keys(req.body)) {
      req.body[key] = xss(req.body[key])
    }
    let formInput = req.body;
    // Check if all fields are supplied
    let missingFields = [];
    if (!formInput.userNameInput) missingFields.push('Username');
    if (!formInput.emailAddressInput) missingFields.push('Email Address');
    if (!formInput.passwordInput) missingFields.push('Password');
    if (!formInput.confirmPasswordInput) missingFields.push('Confirm Password');
    if (!formInput.bioInput) missingFields.push('Bio');
    if (!formInput.profilePic) missingFields.push('Profile Picture');

    if (missingFields.length > 0) {
      return res.status(400).render('login-register/register', {
        title: 'Register',
        hasErrors: true,
        error: `Missing field(s): ${missingFields.join(', ')}`,
        layout: 'external'
      });
    }

    try {
      formInput.userNameInput = val.checkUsername(formInput.userNameInput);
      formInput.emailAddressInput = val.checkEmail(formInput.emailAddressInput);
      formInput.passwordInput = val.checkPass(formInput.passwordInput);
      formInput.confirmPasswordInput = val.confirmPass(formInput.passwordInput, formInput.confirmPasswordInput);
      formInput.bioInput = val.checkBio(formInput.bioInput);
      formInput.profilePic = await val.checkProfilePic(formInput.profilePic);
    } catch (e) {
      return res.status(400).render('login-register/register', {
        title: 'Register',
        hasErrors: true,
        error: e,
        layout: 'external'
      })
    }

    try {
        const inserted = await createUser(
            formInput.userNameInput,
            formInput.emailAddressInput,
            formInput.passwordInput,
            formInput.bioInput,
            formInput.profilePic
        );
        if (inserted) {
          return res.status(200).redirect('/login');
        }
        else {
          return res.status(500).render('login-register/register', { error: 'Internal Server Error', layout: 'external' });
        } 
    }
    catch (e) {
        if (e === 'Internal Server Error') {
          return res.status(500).render('login-register/register', { error: e, layout: 'external' });
        }
        else {
          return res.status(400).render('login-register/register', { error: e, layout: 'external' });
        }
    }

  });

export default router;
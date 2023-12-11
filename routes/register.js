import {Router} from 'express';
import {createUser} from '../data/users.js';
import * as val from '../validation.js';

const router = Router();

router
  .route('/')
  .get(async (req, res) => {
    res.render('register');
  })
  .post(async (req, res) => {
    let formInput = req.body;

    // Check if all fields are supplied
    let missingFields = [];
    if (!formInput.usernameInput) missingFields.push('Username');
    if (!formInput.emailAddressInput) missingFields.push('Email Address');
    if (!formInput.passwordInput) missingFields.push('Password');
    if (!formInput.confirmPasswordInput) missingFields.push('Confirm Password');
    if (!formInput.bioInput) missingFields.push('Bio');
    if (!formInput.profilePictureInput) missingFields.push('Profile Picture');

    if (missingFields.length > 0) {
      return res.status(400).render('register', {
        title: 'Register',
        hasErrors: true,
        error: `Missing field(s): ${missingFields.join(', ')}`
      });
    }

    try {
      formInput.usernameInput = val.checkUsername(formInput.usernameInput);
      formInput.emailAddressInput = val.checkEmail(formInput.emailAddressInput);
      formInput.passwordInput = val.checkPass(formInput.passwordInput);
      formInput.confirmPasswordInput = val.confirmPass(formInput.passwordInput, formInput.confirmPasswordInput);
      formInput.bioInput = val.checkBio(formInput.bioInput);
      formInput.profilePictureInput = val.checkProfilePic(formInput.profilePictureInput);
    } catch (e) {
      return res.status(400).render('register', {
        title: 'Register',
        hasErrors: true,
        error: e
      })
    }

    try {
        const inserted = await createUser(
            formInput.usernameInput,
            formInput.emailAddressInput,
            formInput.passwordInput,
            formInput.bioInput,
            formInput.profilePictureInput
        );
        if (inserted) {
          return res.status(200).redirect('/login');
        }
        else {
          return res.status(500).render('register', { error: 'Internal Server Error' });
        } 
    }
    catch (e) {
        if (e === 'Internal Server Error') {
          return res.status(500).render('register', { error: e });
        }
        else {
          return res.status(400).render('register', { error: e });
        }
    }

  });

export default router;
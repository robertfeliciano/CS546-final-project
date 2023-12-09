import express from 'express';
import createUser from '../data/users.js';
import { registerValidate } from '../validation.js';


const router = express.Router();


router
  .route('/register')
  .get(async (req, res) => {
    //code here for GET
    //render view of registration form
    if (req.session.user) {
      res.redirect('/posts')
    }
    else {
      res.render('register');
    }
  })
  .post(async (req, res) => {
    //code here for POST
    const { userNameInput, emailAddressInput, passwordInput, confirmPasswordInput, bioInput, profilePictureInput} = req.body;

    // Check if all fields are supplied
    const missingFields = [];
    if (!userNameInput) missingFields.push('Username');
    if (!emailAddressInput) missingFields.push('Email Address');
    if (!passwordInput) missingFields.push('Password');
    if (!confirmPasswordInput) missingFields.push('Confirm Password');
    if (!bioInput) missingFields.push('Bio');
    if (!profilePictureInput) missingFields.push('Profile Picture');

    if (missingFields.length > 0) {
        return res.status(400).render('register', { error: `Missing field(s): ${missingFields.join(', ')}` });
    }
    
    if (passwordInput !== confirmPasswordInput) {
        return res.status(400).render('register', { error: 'Passwords do not match' });
    }

    let check;
    try {
        check = registerValidate(emailAddressInput, passwordInput, bioInput);
    }
    catch (e) {
        return res.status(400).render('register', { error: e });
    }
    if (check !== true) {
        return res.status(400).render('register', { error: check });
    }

    try {
        const user = await createUser(userNameInput, emailAddressInput, passwordInput, [], [], [], bioInput, profilePictureInput);
        if (user) { 
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
import {Router} from 'express';
const router = Router();
import {usersData} from '../data/index.js';
import * as validation from '../validation.js';


router
  .route('/')
  .get(async (req, res) => {
    try {
      let userList = await usersData.getAllUsers();
      res.json(userList);
    } catch (e) {
      res.sendStatus(500);
    }
  });
  
router
  .route('/:id')
  .get(async (req, res) => {
    // try {
    //   req.params.id = validation.checkId(req.params.id, 'ID URL Param');
    // } catch (e) {
    //   return res.status(400).json({error: e});
    // }
    try {
      let user = await usersData.getUserById(req.params.id);
      res.json(user);
    } catch (e) {
      res.status(404).json({error: 'User not found'});
    }
  })
  // .put(async (req, res) => {
  //   let userInfo = req.body;
  //   try {
  //     req.params.id = validation.checkId(req.params.id);
  //     userInfo.firstName = validation.checkString(
  //       userInfo.firstName,
  //       'First Name'
  //     );
  //     userInfo.lastName = validation.checkString(
  //       userInfo.lastName,
  //       'Last Name'
  //     );
  //   } catch (e) {
  //     return res.status(400).json({error: e});
  //   }
  //
  //   try {
  //     const updatedUser = await usersData.updateUserPut(
  //       req.params.id,
  //       userInfo.firstName,
  //       userInfo.lastName
  //     );
  //     res.json(updatedUser);
  //   } catch (e) {
  //     let status = e[0];
  //     let message = e[1];
  //     res.status(status).send({error: message});
  //   }
  // })
  .patch(async (req, res) => {
    let userInfo = req.body;
    // try {
    //   req.params.id = validation.checkId(req.params.id);
    //   if (userInfo.firstName) {
    //     userInfo.firstName = validation.checkString(
    //       userInfo.firstName,
    //       'First Name'
    //     );
    //   }
    //
    //   if (userInfo.lastName) {
    //     userInfo.lastName = validation.checkString(
    //       userInfo.lastName,
    //       'Last Name'
    //     );
    //   }
    // } catch (e) {
    //   return res.status(400).json({error: e});
    // }

    try {
      const updatedUser = await usersData.updateUserPatch(
        req.params.id,
        userInfo
      );
      res.json(updatedUser);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).send({error: message});
    }
  })
  .delete(async (req, res) => {
    // try {
    //   req.params.id = validation.checkId(req.params.id);
    // } catch (e) {
    //   return res.status(400).json({error: e});
    // }

    try {
      let deletedUser = await usersData.removeUser(req.params.id);
      res.json(deletedUser);
    } catch (e) {
      let status = e[0];
      let message = e[1];
      res.status(status).send({error: message});
    }
  });

export default router;






.post(async (req, res) => {
    let userInfo = req.body;

    // try {
    //   userInfo.firstName = validation.checkString(
    //     userInfo.firstName,
    //     'First Name'
    //   );
    //   userInfo.lastName = validation.checkString(
    //     userInfo.lastName,
    //     'Last Name'
    //   );
    // } catch (e) {
    //   return res.status(400).json({error: e});
    // }

    try {
      const newUser = await userData.createUser(
        userInfo.firstName,
        userInfo.lastName,
        userInfo
      );
      res.json(newUser);
    } catch (e) {
      res.sendStatus(500);
    }
  });
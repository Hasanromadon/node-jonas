const express = require('express');
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');


//ROUTER
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);

router.use(authController.protect);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPasword', authController.updatePassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.route('/me').get(userController.getMe, userController.getUser);

router.use(authController.restricTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);



module.exports = router;
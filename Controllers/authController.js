const crypto = require('crypto');
const {
  promisify
} = require('util'); //untuk manggil promisify  method
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({
      id
    },
    process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), //convet to milli seccony
    httpOnly: true
  }

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;


  res.cookie('jwt', token, cookieOption);


  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  newUser.password = undefined;
  createSendToken(newUser, 201, res);

});

exports.login = catchAsync(async (req, res, next) => {
  const {
    email,
    password
  } = req.body;

  //1) check email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2) if the user exist && password is

  const user = await User.findOne({
    email
  }).select('+password'); // + mengambil atau menampilakn password yang defaultnya false
  // const correct = await user.correctPassword(Password, user.password); //isinya true atau false
  if (!user || !await user.correctPassword(password, user.password)) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //3) if everthing ok, send token to client
  createSendToken(user, 200, res);

});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) Get token and check of it's true
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Your are not logged in! please loggin to get access', 401));
  }
  //2) verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //format promisify
  console.log(decoded);
  //3) check  if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belongin to this user does no longer exist.', 401));
  }
  //4) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! please login again', 401));
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; //memasukan data ke middleware req. user
  console.log(req.user);
  next();
});

exports.restricTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin, lead-gude].role='user
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You dont have permission to perform this action', 403));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get use based on posted
  const user = await User.findOne({
    email: req.body.email
  });

  if (!user) {
    return next(new AppError('There is no user with email adress.', 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false
  });
  //3) Send it to user's Email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot your password sumbit a patch req with your new password. confirm to: ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'token send to mail'
    });
  } catch (err) {
    user.passwordResetToken = 'undefined';
    user.passwordResetExpires = 'undefined';
    await user.save({
      validateBeforeSave: false
    });
    return next(new AppError('there was an error sending email'));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });

  //2) if token has not expired and there is user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //3) update change password at property for the user

  //4) login the user in, and send JWT
  const token = signToken(user._id);

  createSendToken(token, 201, res);
});


exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2) Check if postend current password is correct

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401))
  }
  //3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //tidak pakai saveUpdate karena ada method validator NOT work as intended

  createSendToken(user, 201, res);
});
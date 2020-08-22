const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto'); //build in function
const bcrypt = require('bcryptjs');
//name, email, photo, password, passwordconfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'please provide your email'],
    lowercase: true,
    validate: [validator.isEmail, 'please provide valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minlength: ['8', 'password name must have min 8 character'],
    trim: true,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      //this only works on CREATE and SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//query middleware
userSchema.pre(/^find/, function (next) {
  //this point to current query,
  this.find({
    active: {
      $ne: false,
    },
  });
  next();
});

//middleware happen between receive data and the momment save it data into databse
userSchema.pre('save', async function (next) {
  //only run this function if password modified , update seperti email nama dll tidak boleh menjalankan hash yang dibwahnya
  if (!this.isModified('password')) return next();

  // 12 adalah jumlah salt, tapi bayak salat makin lama
  this.password = await bcrypt.hash(this.password, 12);

  //delete password confirm
  this.passwordConfirm = undefined;
});

//update reset password

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 2000; //agar passwordnya sebelum token create
  next();
});

//instance method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.changePasswordAfter) {
    const changeTimestamp = parseInt(this.passwordChangedAt / 1000, 10);
    return changeTimestamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({
      resetToken,
    },
    this.passwordResetToken
  );

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
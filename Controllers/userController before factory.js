const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    })
    console.log(newObj);
    return newObj;
}



exports.getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find();

    //send response
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });

});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route not yet defined!',
    });
};
exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route not yet defined!',
    });
};


exports.updateMe = catchAsync(async (req, res, next) => {
    //1) Create Error if user post password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This not for password update, please use route : updateMypassword'));
    }

    //2) filter fields 
    const filteredBody = filterObj(req.body, 'name', 'email');

    //3) update user document, gunakan findbyidupdate karena tidak berusan dengan datasenitif
    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updateUser
        }
    });

});

exports.deleteMe = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, {
        active: false
    });

    res.status(204).json({
        status: 'success',
        data: 'null'
    });

});

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route not yet defined!',
    });
};
exports.deleteUser = factory.deleteOne(User);
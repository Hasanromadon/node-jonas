const Review = require('../models/reviewModel');
const factory = require('./factory');


exports.getAllReviews = factory.getAll(Review);
exports.setTourUSerId = (req, res, next) => {
    //Allow nested route / memasukan data ke field user, dan tour
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
}

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
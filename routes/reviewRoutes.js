const express = require('express');
const reviewController = require('../Controllers/reviewController');

const router = express.Router({
    mergeParams: true
}); //merge params, untuk agar review tau id tour yang dikirim
const authController = require('../Controllers/authController');



router.use(authController.protect);
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(reviewController.setTourUSerId, reviewController.createReview);

router
    .route('/:id')
    .delete(reviewController.deleteReview)
    .patch(reviewController.updateReview);


module.exports = router;
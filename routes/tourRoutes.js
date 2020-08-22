const express = require('express');
const tourController = require('../Controllers/tourController');
const authController = require('../Controllers/authController');
const reviewRouter = require('./reviewRoutes');


const router = express.Router();
router.use('/:tourId/reviews', reviewRouter);

router
    .route('/top-5-cheap')
    .get(authController.protect, tourController.aliasTopTours, tourController.getAllTours);


router.route('/tour-within/:distance/center/:latlng/unit/:unit').get(tourController.getTourWithin);


router.route('/tour-stats').get(authController.protect, tourController.getTourStats);

router.route('/monthly-plan/:year').get(authController.protect, tourController.getMonthlyPlan);


router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restricTo('admin', 'lead-guide'), tourController.createTour); //tourController.checkBody
router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restricTo('admin', 'lead-guide'), tourController.updateTour)
    .delete(authController.protect, authController.restricTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
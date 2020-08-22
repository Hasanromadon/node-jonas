/* eslint-disable no-console */
// const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/APIFeatures');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
  //pre filling query dengan middleware
};

exports.getAllTours = async (req, res) => {
  try {
    //execute query
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();

    const tour = await features.query;

    //send response
    res.status(201).json({
      status: 'success',
      results: tour.length,
      data: {
        tour
      }
    });
  } catch (err) {
    // console.log(err);
  }

  // console.log(req.requestTime);
  // res.status(200).json({
  //   status: 'success',
  //   results: tours.length,
  //   data: {
  //     tours,
  //   },
  // });
};

exports.getTour = (req, res) => {
  // const id = req.params.id * 1;
  // const tour = tours.find((el) => el.id === id); //find adalah reguler function
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tours: tour,
  //   },
  // });
};




exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tours: newTour
    }
  });

  // const newTour = new Tour({});
  //newTour.save()

  // try {
  //   const newTour = await Tour.create(req.body);
  //   res.status(201).json({
  //     status: 'success',
  //     data: {
  //       tours: newTour
  //     }
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res) => {

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //return modifiend document rather than orginal *sumber dari documentation
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });


  // try {
  //   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
  //     new: true, //return modifiend document rather than orginal *sumber dari documentation
  //     runValidators: true
  //   });

  //   res.status(200).json({
  //     status: 'success',
  //     data: {
  //       tour
  //     }
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.deleteTour = catchAsync(async (req, res) => {

  await Tour.findByIdAndDelete(req.params.id);
  res.status(204).json({
    //code status 204
    status: 'success',
    data: 'null'
  });

  // try {
  //   await Tour.findByIdAndDelete(req.params.id);
  //   res.status(204).json({
  //     //code status 204
  //     status: 'success',
  //     data: 'null'
  //   });
  // } catch (err) {
  //   console.log(err);
  // }
});

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([{
        $match: {
          ratingAverage: {
            $gte: 4.5
          }
        }
      },
      {
        $group: {
          _id: {
            $toUpper: '$difficulty'
          },
          numTours: {
            $sum: 1
          },
          numRating: {
            $sum: '$ratingQuantity'
          },
          avgRating: {
            $avg: '$ratingAverage'
          },
          avgPrice: {
            $avg: '$price'
          },
          minPrice: {
            $min: '$price'
          },
          maxPrice: {
            $max: '$price'
          }
        }
      },
      {
        $sort: {
          avgPrice: 1 //1 artinya ascending
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(404).json({
      //code status 204
      status: 'fail',
      message: err
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;


    const plan = await Tour.aggregate([{
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), //current years
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            $month: '$startDates'
          },
          numTourStarts: {
            $sum: 1
          },
          tours: {
            $push: '$name'
          }
        }
      },
      {
        $addFields: {
          month: '$_id'
        }
      }, {
        $project: {
          _id: 0
        }
      }, {
        $sort: {
          numTourStarts: -1
        }
      }, {
        $limit: 12
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (err) {
    res.status(404).json({
      //code status 204
      status: 'fail',
      message: err
    });
  }
};
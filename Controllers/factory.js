const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/AppError');


exports.getAll = Model => catchAsync(async (req, res, next) => {

    let filter = {};
    if (req.params.tourId) filter = {
        tour: req.params.tourId
    };



    //execute query
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
    const doc = await features.query;

    //send response
    res.status(201).json({
        status: 'success',
        results: doc.length,
        data: {
            doc
        }
    });
});


exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        if (!doc) {
            return next(new AppError('No data with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.createOne = (model) =>
    catchAsync(async (req, res, next) => {
        const doc = await model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.deleteOne = (model) =>
    catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document with that ID', 404));
        }

        res.status(204).json({
            //code status 204
            status: 'success',
            data: 'null'
        });
    });

exports.updateOne = (model) =>
    catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, //return modifiend document rather than orginal *sumber dari documentation
            runValidators: true
        });

        if (!doc) {
            return next(new AppError('No document with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                doc
            }
        });
    });
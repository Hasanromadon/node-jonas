const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
	review: {
		type: String,
		required: [true, 'Review can not be empty!']
	},
	rating: {
		type: Number,
		min: 1,
		max: 5
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	tour: {
		type: mongoose.Schema.ObjectId,
		ref: 'Tour',
		required: [true, 'Review must belong to a tour.']
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: [true, 'Review must belong to a user']
	}
}, {
	toJSON: {
		virtuals: true
	},
	toObject: {
		virtuals: true
	}
});

//Prevent Dublicate value
reviewSchema.index({
	tour: 1,
	user: 1
}, {
	unique: true
});



reviewSchema.pre(/^find/, function (next) {
	// this.populate({
	// 	path: 'tour',
	// 	select: 'name'
	// }).populate({
	// 	path: 'user',
	// 	select: 'name photo'
	// });

	this.populate({
		path: 'user',
		select: 'name photo'
	});



	next();
});

//Static Method. this model on this document
reviewSchema.statics.calcAVerageRatings = async function (tourId) {
	const stats = await this.aggregate([{
			$match: {
				tour: tourId
			}
		},
		{
			$group: {
				_id: '$tour',
				nRating: {
					$sum: 1
				},
				avgRating: {
					$avg: '$rating'
				}
			}
		}

	]);

	console.log(stats);

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			ratingQuantity: stats[0].nRating,
			ratingAverage: stats[0].avgRating
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingQuantity: 0,
			ratingAverage: 4.5
		});
	}


};


reviewSchema.post('save', function () {
	//this point to current review

	//Review. diganti this.construtor
	this.constructor.calcAVerageRatings(this.tour);
	//post tidak punya akses ke next, pake post karena pake save error
})

//findBy

reviewSchema.pre(/^findOneAnd/, async function (next) {
	//pake karena agar pre memberikan akses data ke post
	this.r = await this.findOne();
	next();
})

reviewSchema.post(/^findOneAnd/, async function () {
	await this.r.constructor.calcAVerageRatings(this.r.tour);
});



const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
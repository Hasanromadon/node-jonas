const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require("./userModel"); tidak perlu User karena sudah di konekin dengan mongoose.Shecma

const tourSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'A tour must have name'],
		unique: true,
		trim: true,
		maxlength: ['40', 'A Tour name must have max 40 character'],
		minlength: ['10', 'A Tour name must have min 10 character'],
		// validate: [validator.isAlpha, 'tour name must alfabert'], //not allow spaces
	},
	slug: String,
	duration: {
		type: Number,
		required: [true, 'a tour must have durations'],
	},
	maxGroupSize: {
		type: Number,
		required: [true, 'a tour must have a group size'],
	},
	difficulty: {
		type: String,
		required: [true, 'a tour must have difficulity'],
		enum: {
			values: ['easy', 'medium', 'difficult'],
			message: 'Difficulty is either : easy, medium, difficult',
		},
	},
	ratingAverage: {
		type: Number,
		default: 4.5,
		set: val => Math.round(val * 10) / 10 //4.66666, 46.666
	},
	ratingQuantity: {
		type: Number,
		default: 0,
	},
	price: {
		type: Number,
		required: [true, 'A tours must has a price'],
	},
	priceDiscount: {
		type: Number,
		validate: {
			validator: function (val) {
				//this only points to current doc on NEW document creation, not an update
				return val < this.price;
			},
			message: 'Discount price {VALUE} should be bellow regular price',
		},
	},
	summary: {
		type: String,
		trim: true,
	},
	description: {
		type: String,
		trim: true,
	},
	imageCover: {
		type: String,
		required: [true, 'A tour must have a cover image'],
	},
	images: [String],
	createdAt: {
		type: Date,
		default: Date.now(),
		select: false, //tidak ditampilkan hasilnya
	},
	startDates: [Date],
	secretTour: {
		type: Boolean,
		default: false,
	},
	startLocation: {
		//geoJSON
		type: {
			String,
			default: 'Point',
			enum: ['point']
		},
		coordinates: [Number],
		address: String,
		description: String
	},
	locations: [{
		type: {
			type: String,
			default: 'Point',
			enum: ['Point']
		},
		coordinates: [Number],
		address: String,
		description: String,
		day: Number

	}],
	guides: [{
		type: mongoose.Schema.ObjectId,
		ref: 'User'
	}]
}, {
	toJSON: {
		virtuals: true,
	}, //agar ditampilkan di output
	toObject: {
		virtuals: true,
	},
});


//Ascending price
tourSchema.index({
	price: 1,
	ratingAverage: -1
});

tourSchema.index({
	slug: 1
});

tourSchema.index({
	startLocation: '2dsphere'
});


tourSchema.virtual('durationweeks').get(function () {
	return this.duration / 7;
});


// Virtual populate
tourSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id'
});




//pake reguler function karena ingin menggunakan properti this.

//DOCUMENT MIDDLEWARE : run before .save() and create()
tourSchema.pre('save', function (next) {
	//this to get access to document being save
	this.slug = slugify(this.name, {
		lower: true,
	});
	console.log(this);
	next();
});
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//EMBEDED DOCUMENT DATA // syaratnya type shema Array

// tourSchema.pre('save', async function (next) {
// 	const guidesPromises = this.guides.map(async id => await User.findById(id)); //array promises
// 	this.guides = await Promise.all(guidesPromises);

// });



//QUERY MIDDLEWARE

// tourSchema.pre('find', function (next) {
//^find/ regex , jalankan fungsi nya jika di awali find
tourSchema.pre(/^find/, function (next) {
	this.find({
		secretTour: {
			$ne: true,
		},
	});
	//current query obj
	this.start = Date.now();
	next();
});

tourSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'guides',
		select: '-__v -passwordChangedAt'
	});
	next();
});

tourSchema.post(/^find/, function (docs, next) {
	console.log(`query took ${Date.now() - this.start} millisecond`);
	next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
	console.log(this); //current aggregation obj
	this.pipeline().unshift({
		$match: {
			secretTour: {
				$ne: true,
			},
		},
	});
	next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
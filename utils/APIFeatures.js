class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = {
            ...this.queryString
        }; //dicopy query nya semua dari req.query
        const excludeFields = ['page', 'sort', 'limit', 'fields'];

        excludeFields.forEach((el) => delete queryObj[el]);
        //{duration: 5,difficulty: 'easy'} cara lain filter dg query
        // .where('duration')
        // .equals(5) //equal bs di ganti lte, karena ini query bawaan lansung mongodb
        // .where('difficulty')
        // .equals('easy');
        //execute query

        //ADVANCE FILTERING
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //temukan gte|gt|lte|lt, ganti dengan $

        this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            w
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt'); //diberi tanda strip karena agar di urutkan dari yang terbaru
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1; //dikali 1 untuk convert string menjadi number
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit; //

        this.query = this.query.skip(skip).limit(limit); //skip untk menskip 10 return pertama

        return this;
    }
}

module.exports = APIFeatures;


//BUILD QUERY
// const queryObj = {
//   ...req.query
// }; //dicopy query nya semua dari req.query
// const excludeFields = ['page', 'sort', 'limit', 'fields'];

// excludeFields.forEach((el) => delete queryObj[el]);
// //{duration: 5,difficulty: 'easy'} cara lain filter dg query
// // .where('duration')
// // .equals(5) //equal bs di ganti lte, karena ini query bawaan lansung mongodb
// // .where('difficulty')
// // .equals('easy');
// //execute query

// //ADVANCE FILTERING
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //temukan gte|gt|lte|lt, ganti dengan $
// console.log(JSON.parse(queryStr));
// let query = Tour.find(JSON.parse(queryStr));

//SORT
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   console.log(sortBy);
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('-createdAt'); //diberi tanda strip karena agar di urutkan dari yang terbaru
// }

//LIMITING
// if (req.query.fields) {
// 	const fields = req.query.fields.split(',').join(' ');
// 	query = query.select(fields);
// }

//PAGINATION

//page=2&limit=10

// const page = req.query.page * 1 || 1; //dikali 1 untuk convert string menjadi number
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit; //

// query = query.skip(skip).limit(limit); //skip untk menskip 10 return pertama

// if (req.query.page) {
// 	const numtours = await Tour.countDocuments();
// 	if (skip >= numtours) throw new Error('This page does not exist');
// }
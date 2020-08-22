const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `Invalid error ${err.path} : ${err.value}`;

  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token, please login again!', 401);
const handleJWTExpiredToken = () => new AppError('Your Token has expired, please login again!', 401);


const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operational, trusted error : send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //programming or other unknown error : dont leak error details
  } else {
    console.error('ERROR', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  const processEnv = process.env.NODE_ENV.trim();
  if (processEnv === 'development') {
    sendErrorDev(err, res);
  } else if (processEnv === 'production') {
    let error = {
      ...err
    };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredToken(error);

    sendErrorProd(error, res);
  }
};
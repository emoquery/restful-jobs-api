const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errMessage: err.message,
      stack: err.stack,
    });
  }

  if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    error.message = err.message;

    if (err.name === "CastError") {
      const message = `Resourse not found.Invalid ${err.path}`;
      error = new ErrorHandler(message, 404);
    }

    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      error = new ErrorHandler(message, 400);
    }

    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
      error = new ErrorHandler(message, 400);
    }

    if (err.name === "JsonWebTokenError") {
      const message = "json web token is invalid. try again";
      error = new ErrorHandler(message, 500);
    }

    if (err.name === "TokenExpiredError") {
      const message = "json web token is expired. try again";
      error = new ErrorHandler(message, 500);
    }

    res.status(err.statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }

  err.message = err.message || "Internal Server Error";

  res.status(error.statusCode).json({
    success: false,
    message: err.message,
  });
};

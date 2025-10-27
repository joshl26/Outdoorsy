// A custom error class for application-specific errors
// file: utils/errors/AppError.js

const ExpressError = require('../ExpressError');

/**
 * AppError class extends the base ExpressError class.
 * Used for general application errors with customizable status codes.
 * Defaults to HTTP 500 Internal Server Error if no status code is provided.
 */
class AppError extends ExpressError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
  }
}

module.exports = AppError;

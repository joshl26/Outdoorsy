const ExpressError = require('../ExpressError');

class AppError extends ExpressError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
  }
}

module.exports = AppError;

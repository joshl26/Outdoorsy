// A custom error class for handling 404 Not Found errors.
// file: utils/errors/NotFoundError.js

const AppError = require('./AppError');

/**
 * NotFoundError class extends AppError.
 * Used specifically for resources that cannot be found.
 * Defaults to HTTP 404 Not Found status code.
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

module.exports = NotFoundError;

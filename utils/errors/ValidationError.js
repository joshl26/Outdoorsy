// A custom error class for handling validation errors in an application.
// file: utils/errors/ValidationError.js

const AppError = require('./AppError');

/**
 * ValidationError class extends AppError.
 * Used specifically for input validation errors.
 * Defaults to HTTP 400 Bad Request status code.
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

module.exports = ValidationError;

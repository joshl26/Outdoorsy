// A custom error class for handling authentication errors
// file: utils/errors/AuthenticationError.js

const AppError = require('./AppError');

/**
 * AuthenticationError class extends AppError.
 * Used specifically for authentication-related errors.
 * Defaults to HTTP 401 Unauthorized status code.
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

module.exports = AuthenticationError;

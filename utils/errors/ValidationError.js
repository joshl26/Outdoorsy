const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

module.exports = ValidationError;

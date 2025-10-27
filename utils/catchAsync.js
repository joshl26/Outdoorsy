// Utility to catch errors in async Express middleware
// file: utils/catchAsync.js

/**
 * Utility to wrap async middleware functions.
 * Catches errors and passes them to Express error handler.
 * @param {Function} fn - async middleware function (req, res, next) => Promise
 * @returns {Function} wrapped middleware with error handling
 */
module.exports = function catchAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};

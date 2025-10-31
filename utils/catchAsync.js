// Utility to catch errors in async Express middleware
// file: utils/catchAsync.js

/**
 * Utility to wrap async middleware functions.
 * Catches errors and passes them to Express error handler.
 * @param {Function} fn - async middleware function (req, res, next) => Promise
 * @returns {Function} wrapped middleware with error handling
 */
// utils/catchAsync.js
module.exports = function catchAsync(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
    // ↑ Promise.resolve wraps the result, so even non-async functions work
  };
};

/**
 * Wraps an async function to catch errors and pass them to Express error handler.
 * @param {Function} fn - Async middleware function (req, res, next) => Promise
 * @returns {Function} Express middleware function with error handling
 */
module.exports = function catchAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};

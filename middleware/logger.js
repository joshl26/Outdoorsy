// Middleware for logging HTTP requests
// file: middleware/logger.js

const { logEvents } = require('../utils/logger');

/**
 * Express middleware to log incoming HTTP requests.
 * - Logs method, path, and origin header asynchronously to a log file.
 * - Also logs method and path to the console for immediate visibility.
 * - Calls next() to pass control to the next middleware.
 */
const logger = (req, res, next) => {
  // Log request details asynchronously to 'reqLog.log'
  logEvents(
    `${req.method}\t${req.path}\t${req.headers.origin || 'no-origin'}`,
    'reqLog.log'
  ).catch((err) => {
    // Log any errors during logging to console
    // eslint-disable-next-line no-console
    console.error('Logging failed:', err);
  });

  // Log request method and path to console
  // eslint-disable-next-line no-console
  console.log(`${req.method} ${req.path}`);

  // Proceed to next middleware
  next();
};

module.exports = { logger };

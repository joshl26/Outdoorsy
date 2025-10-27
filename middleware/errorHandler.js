// Custom error handling middleware for Express.js
// file: middleware/errorHandler.js

/**
 * Centralized error handling middleware for Express.
 * - Logs error details to a log file and console.
 * - Sends JSON response if client accepts JSON.
 * - Otherwise, renders an error page with details.
 * - Shows stack trace only in development mode.
 *
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const errorHandler = (err, req, res /*, next */) => {
  const { logEvents } = require('./logger');

  // Log error details to a file for persistent logging
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers?.origin || 'unknown'}`,
    'errLog.log'
  );

  // Log stack trace to console for immediate debugging
  // eslint-disable-next-line no-console
  console.error(err.stack);

  // Use error status code or default to 500 (Internal Server Error)
  const status = err.statusCode || 500;

  // Check if environment is development to show stack trace
  const isDev = process.env.NODE_ENV === 'development';

  res.status(status);

  if (req.accepts('json')) {
    // Respond with JSON error details for API clients
    res.json({
      message: err.message,
      ...(isDev && { stack: err.stack }),
      status,
    });
  } else {
    // Render error page for browser clients
    res.render('error', {
      pageTitle: `Error ${status}`,
      errorMessage: err.message,
      errorStack: isDev ? err.stack : null,
    });
  }
};

module.exports = errorHandler;

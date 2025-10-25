const { logEvents } = require('./logger');

/**
 * Express error handling middleware.
 * Logs error details and sends appropriate response.
 */
const errorHandler = (err, req, res, next) => {
  // Log error details to file
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    'errLog.log'
  );

  // Log stack trace to console for debugging
  console.error(err.stack);

  // Use existing status code or default to 500
  const status =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status);

  // Respond with JSON if request expects JSON, else send simple HTML
  if (req.accepts('json')) {
    res.json({ message: err.message, status });
  } else {
    res.type('text/html').send(`<h1>Error ${status}</h1><p>${err.message}</p>`);
  }
};

module.exports = errorHandler;

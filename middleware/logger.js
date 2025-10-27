const { logEvents } = require('../utils/logger');

// Express middleware to log incoming HTTP requests
const logger = (req, res, next) => {
  // Log request method, URL, and origin header asynchronously
  logEvents(
    `${req.method}\t${req.path}\t${req.headers.origin || 'no-origin'}`,
    'reqLog.log'
  ).catch((err) => console.error('Logging failed:', err));

  // Also log to console for immediate visibility
  console.log(`${req.method} ${req.path}`);

  next();
};

module.exports = { logger };

const { logEvents } = require('../utils/logger');

// Express middleware to log incoming HTTP requests
const logger = (req, res, next) => {
  logEvents(
    `${req.method}\t${req.url}\t${req.headers.origin || 'no-origin'}`,
    'reqLog.log'
  ).catch((err) => console.error('Logging failed:', err));
  console.log(`${req.method} ${req.path}`);
  next();
};

module.exports = { logger };

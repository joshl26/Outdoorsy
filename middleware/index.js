// Aggregates all middleware functions into a single export
// file: middleware/index.js

// Import individual middleware modules
const validation = require('./validation');
const auth = require('./auth');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

/**
 * Export all middleware functions combined into a single object.
 * This allows importing middleware conveniently from one module.
 */
module.exports = {
  ...validation,
  ...auth,
  ...logger,
  ...errorHandler,
};

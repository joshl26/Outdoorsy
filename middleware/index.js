const validation = require('./validation');
const auth = require('./auth');
const logger = require('./logger');
const errorHandler = require('./errorHandler');

module.exports = {
  ...validation,
  ...auth,
  ...logger,
  ...errorHandler,
};

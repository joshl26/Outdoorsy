// __mocks__/logger.js

module.exports = {
  logEvents: jest.fn(),
  logger: jest.fn((req, res, next) => {
    module.exports.logEvents(
      `${req.method}\t${req.url}\t${req.headers.origin || 'no-origin'}`,
      'reqLog.log'
    );
    console.log(`${req.method} ${req.path}`);
    next();
  }),
};

// middleware/__tests__/errorHandler.test.js

process.env.NODE_ENV = 'development'; // Add this line

const errorHandler = require('../errorHandler');
const { logEvents } = require('../logger');

jest.mock('../logger');

describe('errorHandler middleware', () => {
  let req, res, next, err;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/test-url',
      headers: { origin: 'http://localhost' },
      accepts: jest.fn(),
    };
    res = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
      render: jest.fn(), // Mock render method to fix tests
    };
    next = jest.fn();
    err = new Error('Test error');
    err.name = 'TestError';

    // Mock console.error to suppress output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.clearAllMocks();
  });

  it('logs error details and stack trace', () => {
    req.accepts.mockReturnValue(false);

    errorHandler(err, req, res, next);

    expect(logEvents).toHaveBeenCalledWith(
      expect.stringContaining('TestError: Test error'),
      'errLog.log'
    );
    expect(console.error).toHaveBeenCalledWith(err.stack);
  });

  it('responds with JSON if request accepts json', () => {
    req.accepts.mockReturnValue(true);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Test error',
      status: 500,
      stack: expect.any(String),
    });
  });

  it('responds with HTML if request does not accept json', () => {
    req.accepts.mockReturnValue(false);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('error', {
      pageTitle: 'Error 500',
      errorMessage: 'Test error',
      errorStack: expect.any(String),
    });
  });

  it('uses existing res.statusCode if not 200', () => {
    req.accepts.mockReturnValue(true);
    res.statusCode = 400;
    err.statusCode = 400;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Test error',
      status: 400,
      stack: expect.any(String),
    });
  });
});

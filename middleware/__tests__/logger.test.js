// __tests__/logger.test.js

const path = require('path');
const fs = require('fs');

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    appendFile: jest.fn(),
  },
}));

// Use manual mock for logger module
jest.mock('../logger');

const logsDir = path.resolve(__dirname, '../../logs');
const logFileName = 'testLog.log';
const logFilePath = path.join(logsDir, logFileName);

const loggerModule = require('../logger');

describe('logEvents function', () => {
  let logEvents;
  let fsModule;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    fsModule = require('fs');
    // Import real logEvents function, bypassing manual mock
    jest.unmock('../logger');
    logEvents = require('../logger').logEvents;
  });

  it('creates logs directory if it does not exist and appends log', async () => {
    fsModule.existsSync.mockReturnValue(false);
    fsModule.promises.mkdir.mockResolvedValue();
    fsModule.promises.appendFile.mockResolvedValue();

    await logEvents('Test message', logFileName);

    expect(fsModule.existsSync).toHaveBeenCalledWith(logsDir);
    expect(fsModule.promises.mkdir).toHaveBeenCalledWith(logsDir, {
      recursive: true,
    });
    expect(fsModule.promises.appendFile).toHaveBeenCalledWith(
      expect.stringContaining(logFilePath),
      expect.stringContaining('Test message')
    );
  });

  it('appends log if logs directory exists', async () => {
    fsModule.existsSync.mockReturnValue(true);
    fsModule.promises.appendFile.mockResolvedValue();

    await logEvents('Another test message', logFileName);

    expect(fsModule.existsSync).toHaveBeenCalledWith(logsDir);
    expect(fsModule.promises.mkdir).not.toHaveBeenCalled();
    expect(fsModule.promises.appendFile).toHaveBeenCalledWith(
      expect.stringContaining(logFilePath),
      expect.stringContaining('Another test message')
    );
  });

  it('logs error to console if appendFile fails', async () => {
    fsModule.existsSync.mockReturnValue(true);
    const error = new Error('Append failed');
    fsModule.promises.appendFile.mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await logEvents('Failing message', logFileName);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to write to log file')
    );

    console.error.mockRestore();
  });
});

describe('logger middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('calls logEvents and console.log, then calls next', () => {
    const req = {
      method: 'GET',
      url: '/test-url',
      path: '/test-url',
      headers: { origin: 'http://localhost' },
    };
    const res = {};
    const next = jest.fn();

    loggerModule.logger(req, res, next);

    expect(loggerModule.logEvents).toHaveBeenCalledWith(
      'GET\t/test-url\thttp://localhost',
      'reqLog.log'
    );
    expect(console.log).toHaveBeenCalledWith('GET /test-url');
    expect(next).toHaveBeenCalled();
  });

  it('handles missing origin header gracefully', () => {
    const req = {
      method: 'POST',
      url: '/submit',
      path: '/submit',
      headers: {},
    };
    const res = {};
    const next = jest.fn();

    loggerModule.logger(req, res, next);

    expect(loggerModule.logEvents).toHaveBeenCalledWith(
      'POST\t/submit\tno-origin',
      'reqLog.log'
    );
    expect(console.log).toHaveBeenCalledWith('POST /submit');
    expect(next).toHaveBeenCalled();
  });
});

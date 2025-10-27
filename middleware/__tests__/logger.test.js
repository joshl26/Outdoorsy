// const path = require('path');
const fs = require('fs');

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    appendFile: jest.fn(),
  },
}));

const { logEvents } = require('../../utils/logger'); // Adjust path to your logger file

describe('logEvents function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates logs directory if it does not exist and appends log', async () => {
    fs.existsSync.mockReturnValue(false);
    fs.promises.mkdir.mockResolvedValue();
    fs.promises.appendFile.mockResolvedValue();

    await logEvents('Test message', 'testLog.log');

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.promises.mkdir).toHaveBeenCalled();
    expect(fs.promises.appendFile).toHaveBeenCalled();
  });

  it('appends log if logs directory exists', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.promises.appendFile.mockResolvedValue();

    await logEvents('Another test message', 'testLog.log');

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.promises.mkdir).not.toHaveBeenCalled();
    expect(fs.promises.appendFile).toHaveBeenCalled();
  });

  it('logs error to console if appendFile fails', async () => {
    fs.existsSync.mockReturnValue(true);
    const error = new Error('Append failed');
    fs.promises.appendFile.mockRejectedValue(error);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await logEvents('Failing message', 'testLog.log');

    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to write to log file')
    );

    // eslint-disable-next-line no-console
    console.error.mockRestore();
  });
});

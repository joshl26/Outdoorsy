// Utility function to log events to a file with timestamps and unique IDs
// file: utils/logger.js

const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Asynchronously logs events to a specified log file.
 * Creates the logs directory if it doesn't exist.
 * @param {string} message - The message to log
 * @param {string} logFileName - The log file name (e.g., 'errLog.log')
 */
const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;
  const logsDir = path.join(__dirname, '..', 'logs');
  const logFilePath = path.join(logsDir, logFileName);

  try {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      await fsPromises.mkdir(logsDir, { recursive: true });
    }
    // Append log item to the file
    await fsPromises.appendFile(logFilePath, logItem);
  } catch (err) {
    console.error(`Failed to write to log file: ${err}`);
  }
};

module.exports = { logEvents };

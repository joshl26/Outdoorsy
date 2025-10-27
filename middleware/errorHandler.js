const errorHandler = (
  err,
  req,
  res
  // next
) => {
  const { logEvents } = require('./logger');

  // Log error details to file
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers?.origin || 'unknown'}`,
    'errLog.log'
  );

  // Log stack trace to console for debugging
  // eslint-disable-next-line no-console
  console.error(err.stack);

  const status = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  res.status(status);

  if (req.accepts('json')) {
    res.json({
      message: err.message,
      ...(isDev && { stack: err.stack }),
      status,
    });
  } else {
    res.render('error', {
      pageTitle: `Error ${status}`,
      errorMessage: err.message,
      errorStack: isDev ? err.stack : null,
    });
  }
};

module.exports = errorHandler;

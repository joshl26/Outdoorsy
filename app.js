// Main application file for the Outdoorsy web application
// file: app.js

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const { basePath, buildPath } = require('./config/basePath');
const expressLayouts = require('express-ejs-layouts');

const sessionConfig = require('./config/session');
const configurePassport = require('./config/passport');
const helmetConfig = require('./config/security');
const swaggerSetup = require('./config/swagger');
const { logger } = require('./middleware/logger'); // Import logger middleware

const app = express();

// Use custom logger middleware early to log all incoming requests
app.use(logger);

// Use Helmet for setting various HTTP headers for security
app.use(helmetConfig);

// Use express-ejs-layouts for layout support in EJS templates
app.use(expressLayouts);

// Trust first proxy (useful if behind a reverse proxy like Heroku)
app.set('trust proxy', 1);

// Set view engine to EJS and configure views directory and layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/boilerplate');

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files under the basePath (e.g., /outdoorsy)
app.use(basePath, express.static(path.join(__dirname, 'public')));

// Configure session middleware with settings from config/session.js
app.use(session(sessionConfig));

// Use connect-flash for flash messages stored in session
app.use(flash());

// During tests, mock CSRF token to avoid errors
if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    res.locals.csrfToken = 'test-csrf-token';
    next();
  });
}

// Configure Passport.js authentication
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Middleware to set local variables accessible in all views
app.use((req, res, next) => {
  res.locals.basePath = basePath;
  res.locals.buildPath = buildPath;
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware to expose current request path to views (for active nav links, etc.)
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Health check endpoint for CI/testing tools (responds at root /)
app.head('/', (req, res) => res.sendStatus(200));
app.get('/healthz', (req, res) => res.status(200).send('ok'));

// Mount routes with appropriate base paths
app.use(buildPath('campgrounds'), campgroundRoutes);
app.use(buildPath('campgrounds/:id/reviews'), reviewRoutes);
app.use(basePath, userRoutes);

// Home page route
app.get(basePath, (req, res) => {
  res.locals.pageClass = 'home';
  res.locals.pageTitle = 'Outdoorsy - Discover Your Next Adventure';
  res.render('home');
});

// Catch-all route for undefined paths - triggers 404 error
app.all('*', (req, res, next) => {
  const err = new Error('Page Not Found');
  err.statusCode = 404;
  next(err);
});

// Centralized error handling middleware
// Renders error page with message and stack trace in development
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (!err.message) err.message = 'Something went wrong!';
  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).render('error', {
    pageTitle: `Error ${statusCode}`,
    errorMessage: err.message,
    errorStack: isDev ? err.stack : null,
  });
});

// Setup Swagger API documentation routes
swaggerSetup(app);

module.exports = app;

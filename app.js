const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const User = require('./models/user');
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

app.use(logger); // Use logger middleware early

app.use(helmetConfig);

app.use(expressLayouts);

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/boilerplate');
app.use(express.urlencoded({ extended: true }));

app.use(basePath, express.static(path.join(__dirname, 'public')));

app.use(session(sessionConfig));
app.use(flash());

if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    res.locals.csrfToken = 'test-csrf-token';
    next();
  });
}

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.basePath = basePath;
  res.locals.buildPath = buildPath;
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use(buildPath('campgrounds'), campgroundRoutes);
app.use(buildPath('campgrounds/:id/reviews'), reviewRoutes);
app.use(basePath, userRoutes);

app.get(basePath, (req, res) => {
  res.locals.pageClass = 'home';
  res.locals.pageTitle = 'Outdoorsy - Discover Your Next Adventure';
  res.render('home');
});

app.all('*', (req, res, next) => {
  const err = new Error('Page Not Found');
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Something went wrong!';
  res.status(statusCode).render('error', { err });
});

swaggerSetup(app);

module.exports = app;

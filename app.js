// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const { basePath, buildPath } = require('./config/basePath');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');

const app = express();

// Use Helmet early to set secure HTTP headers

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
          'https://cdn.jsdelivr.net/npm/bs-custom-file-input/dist/bs-custom-file-input.min.js',
        ],
        workerSrc: ["'self'", 'blob:'], // Allow blob URLs for web workers
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
          'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
        ],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://cdn.jsdelivr.net',
          'https://events.mapbox.com',
        ],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(expressLayouts);

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/boilerplate'); // default layout
app.use(express.urlencoded({ extended: true }));

// Serve static files under basePath
app.use(basePath, express.static(path.join(__dirname, 'public')));

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'thisshouldbeabettersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: basePath,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// Mock csrfToken in test environment to avoid errors in views
if (process.env.NODE_ENV === 'test') {
  app.use((req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    res.locals.csrfToken = 'test-csrf-token';
    next();
  });
}

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: 'email' }, // Use 'email' instead of 'username'
    User.authenticate()
  )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to expose basePath and currentUser to all views
app.use((req, res, next) => {
  res.locals.basePath = basePath;
  res.locals.buildPath = buildPath;
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Middleware to set current path
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Mount routes with basePath prefix
app.use(buildPath('campgrounds'), campgroundRoutes);
app.use(buildPath('campgrounds/:id/reviews'), reviewRoutes);
app.use(basePath, userRoutes);

// Home route
app.get(basePath, (req, res) => {
  res.locals.pageClass = 'home';
  res.locals.pageTitle = 'Outdoorsy - Discover Your Next Adventure';
  res.render('home');
});

// 404 handler
app.all('*', (req, res, next) => {
  const err = new Error('Page Not Found');
  err.statusCode = 404;
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Something went wrong!';
  res.status(statusCode).render('error', { err });
});

module.exports = app;

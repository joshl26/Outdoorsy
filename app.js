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

const app = express();

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
    secure: true,
    sameSite: 'lax',
    path: basePath,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
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

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Mount routes with basePath prefix
app.use(buildPath('campgrounds'), campgroundRoutes);
app.use(buildPath('campgrounds/:id/reviews'), reviewRoutes);
app.use(basePath, userRoutes);

app.get(basePath, (req, res) => {
  res.render('home');
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = 'Something went wrong!';
  res.status(statusCode).render('error', { err });
});

module.exports = app;

const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');

const csrfProtection = csurf();

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many attempts from this IP, please try again later.',
});

// Middleware to touch session and prevent caching on form pages
function prepareForm(req, res, next) {
  if (!req.session) {
    return next(new Error('Session not initialized'));
  }
  req.session.touch();
  res.set('Cache-Control', 'no-store');
  next();
}

// Conditionally apply CSRF middleware only if not in test environment
const maybeCsrf =
  process.env.NODE_ENV === 'test' ? (req, res, next) => next() : csrfProtection;

router
  .route('/register')
  .get(maybeCsrf, prepareForm, users.renderRegister)
  .post(maybeCsrf, authLimiter, catchAsync(users.register));

router
  .route('/login')
  .get(maybeCsrf, prepareForm, users.renderLogin)
  .post(
    maybeCsrf,
    authLimiter,
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/outdoorsy/login',
    }),
    users.login
  );

router.get('/logout', users.logout);

module.exports = router;

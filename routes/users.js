// User authentication routes with rate limiting, CSRF protection, and session handling.
// file: routes/users.js

const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');

const csrfProtection = csurf();

/**
 * Rate limiter middleware to limit repeated requests to auth routes.
 * - Limits each IP to 10 requests per 15 minutes.
 * - Sends a friendly message when limit is exceeded.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many attempts from this IP, please try again later.',
});

/**
 * Middleware to touch the session and prevent caching on form pages.
 * - Ensures session is active.
 * - Sets Cache-Control header to no-store to prevent caching sensitive pages.
 */
function prepareForm(req, res, next) {
  if (!req.session) {
    return next(new Error('Session not initialized'));
  }
  req.session.touch();
  res.set('Cache-Control', 'no-store');
  next();
}

/**
 * Conditionally apply CSRF protection middleware.
 * - Disabled during tests to avoid CSRF token errors.
 */
const maybeCsrf =
  process.env.NODE_ENV === 'test' ? (req, res, next) => next() : csrfProtection;

/**
 * Registration routes:
 * - GET: Render registration form with CSRF token and session preparation.
 * - POST: Apply CSRF, rate limiting, and validation before user registration.
 */
router
  .route('/register')
  .get(maybeCsrf, prepareForm, users.renderRegister)
  .post(maybeCsrf, authLimiter, catchAsync(users.register));

/**
 * Login routes:
 * - GET: Render login form with CSRF token and session preparation.
 * - POST: Apply CSRF, rate limiting, and authenticate using Passport local strategy.
 *   On failure, flash message and redirect to login page.
 *   On success, call users.login controller.
 */
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

/**
 * Logout route:
 * - Calls users.logout controller to log out the user.
 */
router.get('/logout', users.logout);

module.exports = router;

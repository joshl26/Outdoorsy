// Controller for user registration, login, and logout.
// file: controllers/users.js

const { validationResult, body } = require('express-validator');
const User = require('../models/user');

/**
 * Render the user registration form.
 * Passes empty errors and formData objects and CSRF token for security.
 */
module.exports.renderRegister = (req, res) => {
  res.render('users/register', {
    errors: [],
    formData: {},
    csrfToken: req.csrfToken(),
  });
};

/**
 * Handler for user registration.
 * - Validates input using express-validator.
 * - If validation errors exist, re-renders form with errors and previous input.
 * - Registers new user with Passport-local-mongoose.
 * - Logs in the user automatically after registration.
 * - Uses centralized error handling for exceptions.
 */
const registerHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Validation failed: re-render form with errors and previous input
    return res.status(400).render('users/register', {
      errors: errors.array(),
      formData: req.body,
      csrfToken: req.csrfToken(), // always pass csrfToken
    });
  }

  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });

    // Register user with hashed password
    const registeredUser = await User.register(user, password);

    // Log in the user immediately after registration
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash('success', 'Welcome to Outdoorsy!');
      res.redirect('/outdoorsy/campgrounds');
    });
  } catch (e) {
    next(e); // Pass error to centralized error handler
  }
};

/**
 * Validation middleware for registration form fields.
 * - Username: 3-30 chars, letters/numbers/underscores only.
 * - Email: normalized and valid email format.
 * - Password: min 8 chars, must contain letters and numbers.
 */
module.exports.register = [
  body('username')
    .trim()
    .escape() // sanitize to prevent XSS
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'Username can only contain letters, numbers, and underscores.'
    ),
  body('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Please enter a valid email address.'),
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    .withMessage('Password must contain letters and numbers.'),
  registerHandler,
];

// Export the handler separately for testing
module.exports.registerHandler = registerHandler;

/**
 * Render the login form.
 * Passes CSRF token and empty errors array.
 */
module.exports.renderLogin = (req, res) => {
  res.render('users/login', {
    csrfToken: req.csrfToken(),
    errors: [], // or error: '' if you use a string
  });
};

/**
 * Login success handler.
 * - Shows success flash message.
 * - Redirects to originally requested URL or default campgrounds page.
 */
module.exports.login = (req, res) => {
  req.flash('success', 'Welcome back!');
  const redirectUrl = req.session.returnTo || '/outdoorsy/campgrounds';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

/**
 * Logout handler.
 * - Calls Passport's logout method.
 * - Handles potential errors.
 * - Shows goodbye flash message.
 * - Redirects to campgrounds page.
 */
module.exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Goodbye!');
    res.redirect('/outdoorsy/campgrounds');
  });
};

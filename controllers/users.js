const { validationResult, body } = require('express-validator');
const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
  res.render('users/register', {
    errors: [],
    formData: {},
    csrfToken: req.csrfToken(),
  });
};

const registerHandler = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('users/register', {
      errors: errors.array(),
      formData: req.body,
      csrfToken: req.csrfToken(), // always pass csrfToken
    });
  }

  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash('success', 'Welcome to Outdoorsy!');
      res.redirect('/outdoorsy/campgrounds');
    });
  } catch (e) {
    next(e); // Pass error to centralized error handler
  }
};

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

module.exports.renderLogin = (req, res) => {
  res.render('users/login', {
    csrfToken: req.csrfToken(),
    errors: [], // or error: '' if you use a string
  });
};

module.exports.login = (req, res) => {
  req.flash('success', 'Welcome back!');
  const redirectUrl = req.session.returnTo || '/outdoorsy/campgrounds';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Goodbye!');
    res.redirect('/outdoorsy/campgrounds');
  });
};

// Passport Configuration
// config/passport.js

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');

/**
 * Configures Passport.js for local authentication using email and password.
 * - Uses passport-local strategy with 'email' as the username field.
 * - Uses Passport-Local Mongoose's built-in authenticate method.
 * - Sets up serialization and deserialization of user instances to support login sessions.
 */
const configurePassport = () => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, // Use 'email' instead of default 'username'
      User.authenticate() // Passport-Local Mongoose method to authenticate users
    )
  );

  // Serialize user instance to session
  passport.serializeUser(User.serializeUser());

  // Deserialize user instance from session
  passport.deserializeUser(User.deserializeUser());
};

module.exports = configurePassport;

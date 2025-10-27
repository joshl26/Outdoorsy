// config/passport.js

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');

const configurePassport = () => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, // Use 'email' instead of 'username'
      User.authenticate()
    )
  );

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
};

module.exports = configurePassport;

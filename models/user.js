const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

/**
 * User schema for storing user accounts.
 * Fields:
 * - email: User's email address, required and unique.
 *
 * Uses passport-local-mongoose plugin to add:
 * - username and password fields (username replaced by email here)
 * - password hashing and authentication methods
 */
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

// Configure passport-local-mongoose to use 'email' as the username field
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);

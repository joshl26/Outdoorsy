// User model definition using Mongoose and Passport-Local-Mongoose
// file: models/user.js

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
    unique: true, // creates a unique index (ensure created in production!)
    lowercase: true,
    trim: true,
  },
  // If you keep a display username, you can index it if needed:
  // username: { type: String, trim: true, index: true },
});

// Ensure index explicitly (Mongoose will create based on unique, this clarifies intent)
UserSchema.index({ email: 1 }, { unique: true });

// Configure passport-local-mongoose to use 'email' as the username field
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);

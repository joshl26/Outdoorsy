// User model definition using Mongoose and Passport-Local-Mongoose
// file: models/user.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

/**
 * User schema for storing user accounts.
 * Fields:
 * - email: User's email address, required and unique.
 * - favorites: Array of Campground ObjectIds the user has bookmarked.
 *
 * Uses passport-local-mongoose plugin to add:
 * - username and password fields (username replaced by email here)
 * - password hashing and authentication methods
 * - createdAt and updatedAt timestamps
 */
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // This creates the unique index - no need for schema.index()
      trim: true,
      lowercase: true,
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Campground',
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Optional index for faster favorites membership checks
UserSchema.index({ favorites: 1 });

// Configure passport-local-mongoose to use 'email' as the username field
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);

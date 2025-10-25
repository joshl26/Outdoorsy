const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

// Adds username, hash and salt fields to store username and hashed password
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);

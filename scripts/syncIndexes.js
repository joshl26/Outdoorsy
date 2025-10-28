/* eslint-disable no-console */
// scripts/syncIndexes.js
require('dotenv').config();
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const Review = require('../models/review');
const User = require('../models/user');

(async () => {
  try {
    await mongoose.connect(
      process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy'
    );
    console.log('Connected');

    console.log('Syncing Campground indexes...');
    console.log(await Campground.syncIndexes());

    console.log('Syncing Review indexes...');
    console.log(await Review.syncIndexes());

    console.log('Syncing User indexes...');
    console.log(await User.syncIndexes());

    console.log('Done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
})();

/* eslint-disable no-console */
// scripts/check-orphans.js
require('dotenv').config();
const mongoose = require('mongoose');

const Campground = require('../models/campground');
const Review = require('../models/review');
const User = require('../models/user');

const MONGODB_URI = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';

async function main() {
  await mongoose.connect(MONGODB_URI, {
    // adjust options if needed
  });
  console.log('Connected to MongoDB');

  // Load IDs sets for existence checks
  const [userIds, campgroundIds] = await Promise.all([
    User.find({}, { _id: 1 })
      .lean()
      .then((docs) => new Set(docs.map((d) => String(d._id)))),
    Campground.find({}, { _id: 1 })
      .lean()
      .then((docs) => new Set(docs.map((d) => String(d._id)))),
  ]);
  console.log(`Users: ${userIds.size}, Campgrounds: ${campgroundIds.size}`);

  // 1) Reviews with missing author or campground
  const reviews = await Review.find(
    {},
    { _id: 1, author: 1, campground: 1 }
  ).lean();
  let orphanReviewsByAuthor = [];
  let orphanReviewsByCampground = [];
  for (const r of reviews) {
    const authorId = r.author ? String(r.author) : null;
    const cgId = r.campground ? String(r.campground) : null;
    if (!authorId || !userIds.has(authorId)) orphanReviewsByAuthor.push(r._id);
    if (!cgId || !campgroundIds.has(cgId))
      orphanReviewsByCampground.push(r._id);
  }

  // 2) Campgrounds with missing author
  const campgrounds = await Campground.find({}, { _id: 1, author: 1 }).lean();
  let orphanCampgroundsByAuthor = [];
  for (const c of campgrounds) {
    const authorId = c.author ? String(c.author) : null;
    if (!authorId || !userIds.has(authorId))
      orphanCampgroundsByAuthor.push(c._id);
  }

  // 3) Optional: validate geometry types
  const invalidGeometry = await Campground.find(
    {
      $or: [
        { geometry: { $exists: false } },
        { 'geometry.type': { $ne: 'Point' } },
        { 'geometry.coordinates.0': { $exists: false } },
        { 'geometry.coordinates.1': { $exists: false } },
      ],
    },
    { _id: 1 }
  ).lean();

  console.log('--- Orphan Check Report ---');
  console.log(`Reviews with missing author: ${orphanReviewsByAuthor.length}`);
  console.log(
    `Reviews with missing campground: ${orphanReviewsByCampground.length}`
  );
  console.log(
    `Campgrounds with missing author: ${orphanCampgroundsByAuthor.length}`
  );
  console.log(
    `Campgrounds with invalid/missing geometry: ${invalidGeometry.length}`
  );

  if (orphanReviewsByAuthor.length) {
    console.log(
      'Example review IDs (missing author):',
      orphanReviewsByAuthor.slice(0, 10)
    );
  }
  if (orphanReviewsByCampground.length) {
    console.log(
      'Example review IDs (missing campground):',
      orphanReviewsByCampground.slice(0, 10)
    );
  }
  if (orphanCampgroundsByAuthor.length) {
    console.log(
      'Example campground IDs (missing author):',
      orphanCampgroundsByAuthor.slice(0, 10)
    );
  }
  if (invalidGeometry.length) {
    console.log(
      'Example invalid geometry campground IDs:',
      invalidGeometry.slice(0, 10).map((d) => d._id)
    );
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

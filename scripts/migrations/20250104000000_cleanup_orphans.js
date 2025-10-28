/* eslint-disable no-console */
// Migration: Remove orphaned reviews and fix invalid references

const Campground = require('../../models/campground');
const Review = require('../../models/review');
const User = require('../../models/user');

async function up() {
  console.log('Cleaning orphaned reviews and invalid references...');

  const campgroundIds = new Set(
    (await Campground.find({}, '_id').lean()).map((c) => String(c._id))
  );
  const userIds = new Set(
    (await User.find({}, '_id').lean()).map((u) => String(u._id))
  );

  // Delete reviews with non-existent campground
  const orphanedReviews = await Review.find({}, '_id campground').lean();
  const toDelete = orphanedReviews
    .filter((r) => !campgroundIds.has(String(r.campground)))
    .map((r) => r._id);
  if (toDelete.length) {
    const res = await Review.deleteMany({ _id: { $in: toDelete } });
    console.log(`Deleted orphaned reviews: ${res.deletedCount}`);
  } else {
    console.log('No orphaned reviews found');
  }

  // Null out invalid campground authors (or delete – choose policy)
  const camps = await Campground.find({}, '_id author').lean();
  const badAuthors = camps
    .filter((c) => c.author && !userIds.has(String(c.author)))
    .map((c) => c._id);
  if (badAuthors.length) {
    const res = await Campground.updateMany(
      { _id: { $in: badAuthors } },
      { $unset: { author: '' } }
    );
    console.log(`Campgrounds with invalid author unset: ${res.modifiedCount}`);
  } else {
    console.log('No campgrounds with invalid author');
  }

  console.log('✓ Cleanup complete');
}

async function down() {
  console.log(
    'No rollback: deletions/unsets are irreversible without a snapshot.'
  );
}

module.exports = { up, down };

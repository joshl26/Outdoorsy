/* eslint-disable no-console */
// Migration: Add indexes and timestamps to existing data
// Created: Initial migration

const Campground = require('../../models/campground');
const Review = require('../../models/review');
const User = require('../../models/user');

/**
 * Run the migration
 */
async function up() {
  console.log('Creating indexes and adding timestamps...');

  // Create indexes
  console.log('Creating Campground indexes...');
  await Campground.createIndexes();

  console.log('Creating Review indexes...');
  await Review.createIndexes();

  console.log('Creating User indexes...');
  await User.createIndexes();

  // Add timestamps to existing documents
  const campgroundsUpdated = await Campground.updateMany(
    { createdAt: { $exists: false } },
    { $set: { createdAt: new Date(), updatedAt: new Date() } }
  );
  console.log(`Updated ${campgroundsUpdated.modifiedCount} campgrounds`);

  const reviewsUpdated = await Review.updateMany(
    { createdAt: { $exists: false } },
    { $set: { createdAt: new Date(), updatedAt: new Date() } }
  );
  console.log(`Updated ${reviewsUpdated.modifiedCount} reviews`);

  console.log('✓ Migration completed');
}

/**
 * Rollback the migration
 */
async function down() {
  console.log('Rolling back indexes and timestamps...');

  // Drop custom indexes (keep _id and unique indexes)
  await Campground.collection.dropIndex('author_1');
  await Campground.collection.dropIndex('geometry_2dsphere');
  await Campground.collection.dropIndex('price_1_createdAt_-1');

  await Review.collection.dropIndex('campground_1_createdAt_-1');
  await Review.collection.dropIndex('author_1');

  // Note: We don't remove timestamps as data loss is risky
  console.log('⚠ Timestamps not removed to prevent data loss');

  console.log('✓ Rollback completed');
}

module.exports = { up, down };

/* eslint-disable no-empty */
/* eslint-disable no-console */
// Migration: Ensure compound indexes for performance on filters

const mongoose = require('mongoose');

async function up() {
  console.log('Creating compound indexes on campgrounds and reviews...');

  const camp = mongoose.connection.collection('campgrounds');
  const reviews = mongoose.connection.collection('reviews');

  // Campgrounds
  await camp.createIndex(
    { price: 1, createdAt: -1 },
    { name: 'price_1_createdAt_-1' }
  );
  await camp.createIndex(
    { author: 1, createdAt: -1 },
    { name: 'author_1_createdAt_-1' }
  );
  await camp.createIndex(
    { geometry: '2dsphere' },
    { name: 'geometry_2dsphere' }
  );

  // Reviews
  await reviews.createIndex(
    { campground: 1, createdAt: -1 },
    { name: 'campground_1_createdAt_-1' }
  );
  await reviews.createIndex(
    { author: 1, createdAt: -1 },
    { name: 'author_1_createdAt_-1' }
  );

  console.log('✓ Indexes created');
}

async function down() {
  console.log('Dropping compound indexes...');
  const camp = mongoose.connection.collection('campgrounds');
  const reviews = mongoose.connection.collection('reviews');

  try {
    await camp.dropIndex('price_1_createdAt_-1');
  } catch {}
  try {
    await camp.dropIndex('author_1_createdAt_-1');
  } catch {}
  try {
    await camp.dropIndex('geometry_2dsphere');
  } catch {}
  try {
    await reviews.dropIndex('campground_1_createdAt_-1');
  } catch {}
  try {
    await reviews.dropIndex('author_1_createdAt_-1');
  } catch {}

  console.log('✓ Indexes dropped');
}

module.exports = { up, down };

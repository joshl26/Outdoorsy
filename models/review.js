// Mongoose schema and model for user reviews on campgrounds.
// file: models/review.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Review schema for storing user reviews on campgrounds.
 * Fields:
 * - body: Text content of the review, required and trimmed.
 * - rating: Numeric rating between 1 and 5, required.
 * - author: Reference to the User who wrote the review, required.
 *
 * Timestamps option automatically adds:
 * - createdAt: Date when the review was created.
 * - updatedAt: Date when the review was last updated.
 */
const ReviewSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    body: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campground: {
      type: Schema.Types.ObjectId,
      ref: 'Campground',
      required: true,
    },
  },
  { timestamps: true }
);

// Keep only compound indexes you actually query by
ReviewSchema.index(
  { campground: 1, createdAt: -1 },
  { name: 'campground_1_createdAt_-1' }
);
ReviewSchema.index(
  { author: 1, createdAt: -1 },
  { name: 'author_1_createdAt_-1' }
);

// Remove if present:
// ReviewSchema.index({ campground: 1 });
// ReviewSchema.index({ author: 1 });

module.exports = mongoose.model('Review', ReviewSchema);

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
const reviewSchema = new Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Optional future-proofing: store campground ref to enable direct queries on reviews
    campground: { type: Schema.Types.ObjectId, ref: 'Campground', index: true },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Helpful index for "user's recent reviews" lists
reviewSchema.index({ author: 1, createdAt: -1 });

// If you add campground field above, also consider:
reviewSchema.index({ campground: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);

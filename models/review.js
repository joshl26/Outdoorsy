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
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Review', reviewSchema);

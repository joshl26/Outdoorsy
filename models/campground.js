// Campground model definition with image handling, geospatial data, virtuals, and cascading delete for reviews.
// file: models/campground.js

const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

/**
 * Sub-schema for images.
 * Includes a virtual property 'thumbnail' to get a smaller image URL.
 */
const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual('thumbnail').get(function () {
  // Modify URL to request a smaller image version (width 200)
  return this.url.replace('/outdoorsy/upload', '/outdoorsy/upload/w_200');
});

// Enable virtuals when converting documents to JSON
const opts = { toJSON: { virtuals: true } };

/**
 * Campground schema with geospatial data, images, author, and reviews.
 */
const CampgroundSchema = new Schema(
  {
    title: String,
    images: [ImageSchema],
    geometry: {
      type: {
        type: String,
        enum: ['Point'], // GeoJSON Point type
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    price: Number,
    description: String,
    location: String,
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  opts
);

/**
 * Virtual property for popup markup used in map popups.
 */
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `
    <strong><a href="/outdoorsy/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>`;
});

/**
 * Middleware to delete all associated reviews when a campground is deleted.
 */
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: { $in: doc.reviews },
    });
  }
});

module.exports = mongoose.model('Campground', CampgroundSchema);

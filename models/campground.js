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
    title: { type: String, trim: true },
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
    price: { type: Number, index: true },
    description: String,
    location: { type: String, trim: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  { ...opts, timestamps: true } // add timestamps for createdAt/updatedAt
);

/**
 * Indexes for performance
 */
CampgroundSchema.index({ geometry: '2dsphere' });
CampgroundSchema.index({ author: 1, createdAt: -1 });
CampgroundSchema.index({ price: 1 });
// Optional indexes for future filters/search. Uncomment as needed.
// CampgroundSchema.index({ title: 1 });
// CampgroundSchema.index({ location: 1 });
// Example if you plan to filter by price range and location frequently:
// CampgroundSchema.index({ location: 1, price: 1 });

/**
 * Virtual property for popup markup used in map popups.
 */
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `
    <strong><a href="/outdoorsy/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description ? this.description.substring(0, 20) : ''}...</p>`;
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

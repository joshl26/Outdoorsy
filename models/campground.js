// Campground model definition with image handling, geospatial data, virtuals, and cascading delete for reviews.
// file: models/campground.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ImageSchema = new Schema({
  url: String,
  filename: String,
  alt: { type: String, default: null },
});

const CampgroundSchema = new Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true }, // REMOVE index: true here
    description: { type: String },
    location: { type: String },
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
    },
    images: [ImageSchema],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Keep only these indexes (no duplicates)
CampgroundSchema.index({ geometry: '2dsphere' }, { name: 'geometry_2dsphere' });
CampgroundSchema.index(
  { price: 1, createdAt: -1 },
  { name: 'price_1_createdAt_-1' }
);
CampgroundSchema.index(
  { author: 1, createdAt: -1 },
  { name: 'author_1_createdAt_-1' }
);

// If you had any of these previously, remove them:
// CampgroundSchema.index({ price: 1 });
// price: { type: Number, index: true }
// CampgroundSchema.index({ geometry: '2dsphere' }) duplicated twice

module.exports = mongoose.model('Campground', CampgroundSchema);

// Campground model definition with image handling, geospatial data, virtuals, slugs, and cascading delete for reviews.
// file: models/campground.js

const mongoose = require('mongoose');
const { Schema } = mongoose;
const Review = require('./review');
const slugify = require('slugify'); // ✅ npm install slugify

const ImageSchema = new Schema({
  url: String,
  filename: String,
  alt: { type: String, default: null },
});

// Virtual for thumbnail transformation
ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_200');
});

const CampgroundSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true }, // ✅ new: SEO-friendly URL slug
    price: { type: Number, required: true },
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CampgroundSchema.index({ geometry: '2dsphere' }, { name: 'geometry_2dsphere' });
CampgroundSchema.index(
  { price: 1, createdAt: -1 },
  { name: 'price_1_createdAt_-1' }
);
CampgroundSchema.index(
  { author: 1, createdAt: -1 },
  { name: 'author_1_createdAt_-1' }
);

// Text search index for nearby search functionality
CampgroundSchema.index(
  { title: 'text', description: 'text', location: 'text' },
  {
    name: 'campground_text_search',
    weights: { title: 10, location: 5, description: 1 },
  }
);

// ✅ Index for slug lookups
CampgroundSchema.index({ slug: 1 }, { name: 'slug_1' });

// Virtual for populating reviews
CampgroundSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'campground',
});

// ✅ Auto-generate unique slug from title on save
CampgroundSchema.pre('save', async function (next) {
  // Only regenerate slug if title changed or slug doesn't exist
  if (!this.isModified('title') && this.slug) return next();

  let baseSlug = slugify(this.title, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let count = 1;

  // Ensure uniqueness (skip self if updating)
  while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
  next();
});

// Cascade delete reviews when campground is deleted
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({ campground: doc._id });
  }
});

module.exports = mongoose.model('Campground', CampgroundSchema);

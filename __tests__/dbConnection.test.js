require('dotenv').config();
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const User = require('../models/user'); // Import User model to register schema

describe('Connection and Campground Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // Remove or fix this test if you want
  it('Sanity test: 1 equals 1', () => {
    expect(1).toBe(1);
  });

  it('Retrieve a campground by ID', async () => {
    const id = '646d919387d1d5003b83728c'; // Use a valid ID from your DB
    const campground = await Campground.findById(id)
      .populate({
        path: 'reviews',
        populate: { path: 'author' },
      })
      .populate('author');

    expect(campground).not.toBeNull();
    expect(campground.title).toBeDefined();
    expect(typeof campground.title).toBe('string');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});

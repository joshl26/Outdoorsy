// MongoDB connection setup
// config/database.js

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose.
 * - Uses connection string from environment variable or defaults to local DB.
 * - Uses recommended options for stability.
 * - Logs successful connection or errors.
 * - Exits process on initial connection failure.
 */
const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';
    const isProd = process.env.NODE_ENV === 'production';

    // Global Mongoose settings
    mongoose.set('strictQuery', true);
    if (process.env.DB_DEBUG === 'true' && !isProd) {
      mongoose.set('debug', true);
    }

    // Connect to MongoDB with useful defaults
    await mongoose.connect(dbUrl, {
      autoIndex: !isProd, // allow automatic index builds in dev; disable in prod
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // eslint-disable-next-line no-console
    console.log('MongoDB connected');

    // Listen for errors after initial connection
    mongoose.connection.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('MongoDB connection error:', err);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB; // fix export typo

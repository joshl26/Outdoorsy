// MongoDB connection setup
// config/database.js

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose.
 * - Uses connection string from environment variable or defaults to local DB.
 * - Uses recommended options to avoid deprecation warnings.
 * - Logs successful connection or errors.
 * - Exits process on initial connection failure.
 */
const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';

    // Connect to MongoDB with options for compatibility and stability
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Log successful connection
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');

    // Listen for errors after initial connection
    mongoose.connection.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('MongoDB connection error:', err);
    });
  } catch (err) {
    // Log connection error and exit process
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;

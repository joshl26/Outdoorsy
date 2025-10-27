// config/database.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // eslint-disable-next-line no-console
    console.log('MongoDB connected');

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

module.exports = connectDB;

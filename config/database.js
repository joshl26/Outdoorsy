// config/database.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';
    await mongoose.connect(dbUrl, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;

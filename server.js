// Entry point for the Outdoorsy application server
// file: server.js

// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

// MongoDB connection string from environment or default to local
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';

// Connect to MongoDB using Mongoose
mongoose.connect(dbUrl, {
  // useNewUrlParser: true, // Uncomment if needed for compatibility
  // useUnifiedTopology: true, // Uncomment if needed for compatibility
});

const db = mongoose.connection;

// Log connection errors to console
// eslint-disable-next-line no-console
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Once connected, start the Express server
db.once('open', () => {
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');

  // Use port from environment or default to 3053
  const port = process.env.PORT || 3053;

  // Start listening for incoming requests
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Serving on port ${port}`);
  });
});

// Entry point for the Outdoorsy application server
// file: server.js

// Load environment variables from .env file
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');

const port = process.env.PORT || 3053;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving on port ${port}`);
});

connectDB().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.warn('MongoDB disconnected; serving fallback UI until it returns.');
});

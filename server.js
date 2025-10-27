// server.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/outdoorsy';

mongoose.connect(dbUrl, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});

const db = mongoose.connection;
// eslint-disable-next-line no-console
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
  const port = process.env.PORT || 3053;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Serving on port ${port}`);
  });
});

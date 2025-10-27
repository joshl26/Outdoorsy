// config/session.js

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'thisshouldbeabettersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: process.env.BASE_PATH || '/outdoorsy',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};

module.exports = sessionConfig;

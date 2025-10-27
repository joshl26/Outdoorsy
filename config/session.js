// Express session configuration
// config/session.js

/**
 * Configuration object for Express session middleware.
 * - Uses a secret from environment variables for signing the session ID cookie.
 * - Does not resave session if unmodified.
 * - Does not save uninitialized sessions.
 * - Configures cookie settings for security and usability.
 */
const sessionConfig = {
  // Secret key used to sign the session ID cookie
  secret: process.env.SESSION_SECRET || 'thisshouldbeabettersecret',

  // Prevents session from being saved back to the session store if it was never modified during the request
  resave: false,

  // Prevents saving uninitialized sessions (new but not modified)
  saveUninitialized: false,

  cookie: {
    // Cookie is not accessible via client-side JavaScript (helps prevent XSS)
    httpOnly: true,

    // Cookie is only sent over HTTPS in production
    secure: process.env.NODE_ENV === 'production',

    // Controls cross-site request behavior; 'lax' allows some cross-site usage but protects against CSRF
    sameSite: 'lax',

    // Cookie path scope, defaults to '/outdoorsy' or environment variable BASE_PATH
    path: process.env.BASE_PATH || '/outdoorsy',

    // Cookie expiration time: 1 week in milliseconds
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

module.exports = sessionConfig;

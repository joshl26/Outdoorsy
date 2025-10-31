// Helmet security configuration
// config/security.js

const helmet = require('helmet');

/**
 * Helmet middleware configuration to enhance security by setting various HTTP headers.
 * - Configures Content Security Policy (CSP) to restrict sources for scripts, styles, images, etc.
 * - Allows trusted external sources needed for your app (Mapbox, Cloudinary, Bootstrap, etc.).
 * - Disables Cross-Origin Embedder Policy to avoid issues with certain resources.
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        'https://cdn.jsdelivr.net/npm/bs-custom-file-input/dist/bs-custom-file-input.min.js',
        'https://static.cloudflareinsights.com',
      ],

      workerSrc: ["'self'", 'blob:'],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://joshlehman.ca', // explicitly allow first-party absolute URLs
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
      ],

      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://joshlehman.ca', // allow first-party images
        'https://res.cloudinary.com',
        'https://api.mapbox.com', // if you show map tiles as images
        'https://tiles.mapbox.com', // add any tile server or CDN if used
      ],

      connectSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://events.mapbox.com',
      ],

      fontSrc: [
        "'self'",
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net', // if pulling fonts via jsdelivr
        'data:', // allow embedded font sources if needed
      ],

      objectSrc: ["'none'"],

      // Explicitly allow manifest
      manifestSrc: ["'self'", 'https://joshlehman.ca'],

      upgradeInsecureRequests: [],
    },
  },
  // Disable Cross-Origin Embedder Policy to avoid issues with some resources
  crossOriginEmbedderPolicy: false,
});

module.exports = helmetConfig;

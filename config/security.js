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
      // Default policy: only allow resources from same origin
      defaultSrc: ["'self'"],

      // Allowed script sources including inline scripts and trusted CDNs
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts (use with caution)
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        'https://cdn.jsdelivr.net/npm/bs-custom-file-input/dist/bs-custom-file-input.min.js',
        'https://static.cloudflareinsights.com', // For Cloudflare Insights script
      ],

      // Allow web workers from same origin and blob URLs
      workerSrc: ["'self'", 'blob:'],

      // Allowed style sources including inline styles and trusted CDNs
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles (use with caution)
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
      ],

      // Allowed image sources including data URIs, blobs, and Cloudinary
      imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],

      // Allowed connection sources for APIs and events
      connectSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://events.mapbox.com',
      ],

      // Allowed font sources
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],

      // Disallow embedding objects like Flash
      objectSrc: ["'none'"],

      // No upgrade insecure requests directive (empty array)
      upgradeInsecureRequests: [],
    },
  },

  // Disable Cross-Origin Embedder Policy to avoid issues with some resources
  crossOriginEmbedderPolicy: false,
});

module.exports = helmetConfig;

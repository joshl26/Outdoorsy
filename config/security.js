// config/security.js

const helmet = require('helmet');

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
      ],
      workerSrc: ["'self'", 'blob:'], // Allow blob URLs for web workers
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://api.mapbox.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'",
        'https://api.mapbox.com',
        'https://cdn.jsdelivr.net',
        'https://events.mapbox.com',
      ],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = helmetConfig;

/**
 * Base Path Configuration
 * 
 * Centralizes the base path configuration for the application.
 * This allows the app to run on a subpath (e.g., /outdoorsy/)
 * and makes it easy to change or remove the base path in the future.
 */

const basePath = process.env.BASE_PATH || '/outdoorsy';

/**
 * Helper function to build full paths with base path prefix
 * @param {string} path - The path to append to base path
 * @returns {string} Full path with base path prefix
 * 
 * @example
 * buildPath('campgrounds') // Returns: '/outdoorsy/campgrounds'
 * buildPath('/campgrounds') // Returns: '/outdoorsy/campgrounds'
 * buildPath('') // Returns: '/outdoorsy'
 */
const buildPath = (path = '') => {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Remove trailing slash from base path if present
  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  
  // Handle empty path
  if (!cleanPath) {
    return cleanBasePath;
  }
  
  return `${cleanBasePath}/${cleanPath}`;
};

/**
 * Helper function to build asset paths
 * @param {string} assetType - Type of asset (stylesheets, javascripts, images)
 * @param {string} filename - The filename
 * @returns {string} Full asset path
 * 
 * @example
 * buildAssetPath('stylesheets', 'app.css') // Returns: '/outdoorsy/stylesheets/app.css'
 */
const buildAssetPath = (assetType, filename) => {
  return buildPath(`${assetType}/${filename}`);
};

/**
 * Helper function for API paths
 * @param {string} endpoint - API endpoint
 * @returns {string} Full API path
 * 
 * @example
 * buildApiPath('campgrounds') // Returns: '/outdoorsy/api/v1/campgrounds'
 */
const buildApiPath = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return buildPath(`api/v1/${cleanEndpoint}`);
};

module.exports = {
  basePath,
  buildPath,
  buildAssetPath,
  buildApiPath,
  
  // Export common paths for convenience
  paths: {
    home: basePath || '/',
    login: buildPath('login'),
    logout: buildPath('logout'),
    register: buildPath('register'),
    campgrounds: buildPath('campgrounds'),
    reviews: (id) => buildPath(`campgrounds/${id}/reviews`),
    apiDocs: buildPath('api-docs'),
  }
};
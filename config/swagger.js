// Swagger configuration for Outdoorsy API
// config/swagger.js

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger-jsdoc options to generate OpenAPI specification.
 * - Defines API metadata like title, version, and description.
 * - Sets server URL based on BASE_PATH environment variable or default.
 * - Specifies where to find API route files with JSDoc comments for documentation.
 */
const options = {
  definition: {
    openapi: '3.0.0', // OpenAPI version
    info: {
      title: 'Outdoorsy API',
      version: '1.0.0',
      description: 'API documentation for Outdoorsy',
    },
    servers: [
      {
        url: process.env.BASE_PATH || '/outdoorsy', // Base path for API
      },
    ],
  },
  apis: ['./routes/*.js'], // Files containing API route documentation
};

// Generate OpenAPI specification from options and JSDoc comments
const specs = swaggerJsdoc(options);

/**
 * Sets up Swagger UI middleware on the Express app.
 * - Serves API docs at `${BASE_PATH}/api-docs`.
 * @param {Express.Application} app - The Express app instance
 */
const swaggerSetup = (app) => {
  app.use(
    (process.env.BASE_PATH || '/outdoorsy') + '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs)
  );
};

module.exports = swaggerSetup;

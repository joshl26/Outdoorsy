// config/swagger.js

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Outdoorsy API',
      version: '1.0.0',
      description: 'API documentation for Outdoorsy',
    },
    servers: [
      {
        url: process.env.BASE_PATH || '/outdoorsy',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use(
    (process.env.BASE_PATH || '/outdoorsy') + '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs)
  );
};

module.exports = swaggerSetup;

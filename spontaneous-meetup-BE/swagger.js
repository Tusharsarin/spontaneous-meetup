import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Spontaneous Meetup API',
      version: '1.0.0',
      description: 'API documentation for Spontaneous Meetup application',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes.js'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
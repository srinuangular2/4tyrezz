const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: '4TYREZZ API',
      version: '1.0.0',
      description:
        'Used-car marketplace REST API — auth, inventory, leads, bookings, payments, valuations, CMS.',
    },
    servers: [{ url: '/api', description: 'API root' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Paginated: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Cars' },
      { name: 'Meta' },
      { name: 'Content' },
      { name: 'Dealers' },
      { name: 'Leads' },
      { name: 'TestDrives' },
      { name: 'Bookings' },
      { name: 'Payments' },
      { name: 'Commissions' },
      { name: 'Valuations' },
      { name: 'Compare' },
      { name: 'Enquiries' },
      { name: 'Wishlist' },
      { name: 'SavedSearches' },
      { name: 'Reviews' },
      { name: 'Support' },
      { name: 'Notifications' },
      { name: 'Promotions' },
      { name: 'Admin' },
      { name: 'Reference' },
      { name: 'Banners' },
      { name: 'Vehicles' },
    ],
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './docs/*.yaml',
    './docs/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

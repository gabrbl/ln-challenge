const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const jwt = require('@fastify/jwt');
const env = require('@fastify/env');
const database = require('./config/database');
const routes = require('./routes');

const schema = {
  type: 'object',
  required: ['PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'],
  properties: {
    PORT: { type: 'number', default: 3000 },
    HOST: { type: 'string', default: '0.0.0.0' },
    DB_HOST: { type: 'string' },
    DB_PORT: { type: 'number', default: 3306 },
    DB_USER: { type: 'string' },
    DB_PASSWORD: { type: 'string' },
    DB_NAME: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    NODE_ENV: { type: 'string', default: 'development' }
  }
};

const start = async () => {
  try {

    await fastify.register(env, { schema, dotenv: true });
    await fastify.register(cors, { origin: true });    
    await fastify.register(jwt, { secret: fastify.config.JWT_SECRET });
    
    // Swagger
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'Catalog Manager API',
          description: 'API para gestión de catálogo de productos',
          version: '1.0.0'
        },
        host: `localhost:${fastify.config.PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    });
    
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: false }
    });
    
    // Database
    await database.connect(fastify.config);
    fastify.decorate('db', database);
    
    // Routes
    await fastify.register(routes, { prefix: '/api' });
    
    // Start server
    await fastify.listen({ 
      port: fastify.config.PORT, 
      host: fastify.config.HOST 
    });
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

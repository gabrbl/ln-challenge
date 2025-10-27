const AuthController = require('../controllers/auth.controller');
const { ErrorResponse } = require('../utils/errors');


const loginSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      password: { type: 'string', minLength: 6, maxLength: 100 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        token: { type: 'string' }
      }
    }
  }
};

/** Error handler personalizado para rutas de autenticación */
function authErrorHandler(error, request, reply) {
  if (error instanceof ErrorResponse) {
    return reply.code(error.code).send(error.toJSON());
  }

  // Errores de validación de Fastify
  if (error.validation) {
    return reply.code(400).send({
      code: 400,
      message: 'Validation Error',
      description: error.message,
      validation: error.validation
    });
  }

  // Error genérico
  request.log.error(error, 'Unhandled error in auth routes');
  return reply.code(500).send({
    code: 500,
    message: 'Internal Server Error',
    description: 'Authentication service error'
  });
}

module.exports = async function (fastify, opts) {
  const controller = new AuthController(fastify);

  fastify.post('/login', {
    schema: loginSchema,
    errorHandler: authErrorHandler,
    handler: controller.login.bind(controller)
  });
};

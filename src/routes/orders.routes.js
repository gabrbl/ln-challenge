const OrderController = require('../controllers/order.controller');
const { orderListSchema, orderCreateSchema } = require('../schemas/order.schema');
const { authenticate, rateLimit } = require('../middlewares/auth.middleware');
const { validateQueryParams, validateBody } = require('../middlewares/validation.middleware');
const { ErrorResponse } = require('../utils/errors');

/** Error handler personalizado para rutas de órdenes */
function orderErrorHandler(error, request, reply) {
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
  request.log.error(error, 'Unhandled error in order routes');
  return reply.code(500).send({
    code: 500,
    message: 'Internal Server Error',
    description: error.message
  });
}

module.exports = async function (fastify, opts) {
  const controller = new OrderController(fastify.db);

  // Listado de órdenes
  fastify.get('/orders', {
    schema: orderListSchema,
    preHandler: [rateLimit, authenticate, validateQueryParams],
    errorHandler: orderErrorHandler,
    handler: controller.list.bind(controller)
  });

  // Crear orden
  fastify.post('/orders', {
    schema: orderCreateSchema,
    preHandler: [rateLimit, authenticate, validateBody],
    errorHandler: orderErrorHandler,
    handler: controller.create.bind(controller)
  });
};

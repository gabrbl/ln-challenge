const ProductController = require('../controllers/product.controller');
const {
  productSearchSchema,
  productListSchema,
  productDetailSchema
} = require('../schemas/product.schema');
const { validateQueryParams } = require('../middlewares/validation.middleware');
const { rateLimit } = require('../middlewares/auth.middleware');
const { ErrorResponse } = require('../utils/errors');

/** Error handler personalizado para rutas de productos */
function productErrorHandler(error, request, reply) {
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
  request.log.error(error, 'Unhandled error in product routes');
  return reply.code(500).send({
    code: 500,
    message: 'Internal Server Error',
    description: error.message
  });
}

module.exports = async function (fastify, opts) {
  const controller = new ProductController(fastify.db);

  // Búsqueda de productos
  fastify.get('/search', {
    schema: productSearchSchema,
    preHandler: [rateLimit, validateQueryParams],
    errorHandler: productErrorHandler,
    handler: controller.search.bind(controller)
  });

  // Listado de productos
  fastify.get('/products', {
    schema: productListSchema,
    preHandler: [rateLimit, validateQueryParams],
    errorHandler: productErrorHandler,
    handler: controller.list.bind(controller)
  });

  // Detalle de producto
  fastify.get('/products/:slug', {
    schema: productDetailSchema,
    preHandler: [rateLimit],
    errorHandler: productErrorHandler,
    handler: controller.getBySlug.bind(controller)
  });
};


const productRoutes = require('./products.routes');
const orderRoutes = require('./orders.routes');
const authRoutes = require('./auth.routes');

module.exports = async function(fastify, opts) {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(productRoutes);
  await fastify.register(orderRoutes);
};

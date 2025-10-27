const orderListSchema = {
  querystring: {
    type: 'object',
    properties: {
      order_id: { type: 'integer' },
      cuit: { type: 'string' },
      created_at_min: { type: 'string', format: 'date-time' },
      created_at_max: { type: 'string', format: 'date-time' }
    }
  },
  security: [{ Bearer: [] }]
};

const orderCreateSchema = {
  body: {
    type: 'object',
    required: ['cliente_id', 'producto_id', 'cantidad_solicitada'],
    properties: {
      cliente_id: { type: 'integer' },
      producto_id: { type: 'integer' },
      cantidad_solicitada: { type: 'integer', minimum: 1 },
      clase_entrega: { type: 'string' },
      condicion_pago_aplicada: { type: 'string' }
    }
  },
  security: [{ Bearer: [] }]
};

module.exports = {
  orderListSchema,
  orderCreateSchema
};

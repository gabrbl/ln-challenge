const productSearchSchema = {
  querystring: {
    type: 'object',
    properties: {
      q: { type: 'string' },
      orderBy: { type: 'string', enum: ['created_at', 'precio', 'categoria'] },
      order: { type: 'string', enum: ['ASC', 'DESC'] },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    },
    required: ['q']
  }
};

const productListSchema = {
  querystring: {
    type: 'object',
    properties: {
      orderBy: { type: 'string', enum: ['created_at', 'precio', 'categoria'] },
      order: { type: 'string', enum: ['ASC', 'DESC'] },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      category: { type: 'string' }
    }
  }
};

const productDetailSchema = {
  params: {
    type: 'object',
    properties: {
      slug: { type: 'string' }
    },
    required: ['slug']
  }
};

module.exports = {
  productSearchSchema,
  productListSchema,
  productDetailSchema
};

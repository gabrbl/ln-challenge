const { ErrorResponse } = require('../utils/errors');

// Límites de validación
const MAX_PAGE_NUMBER = 1000;
const MAX_LIMIT_VALUE = 100;
const MIN_LIMIT_VALUE = 1;
const MAX_CATEGORY_LENGTH = 50;

/** Sanitiza inputs para prevenir inyección SQL */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

/** Sanitiza recursivamente un objeto */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return;

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  });
}

/** Valida y normaliza límites de paginación */
function validatePaginationLimits(query) {
  if (query.limit) {
    const limit = parseInt(query.limit, 10);
    
    if (limit > MAX_LIMIT_VALUE) {
      query.limit = MAX_LIMIT_VALUE;
    } else if (limit < MIN_LIMIT_VALUE) {
      query.limit = MIN_LIMIT_VALUE;
    }
  }

  if (query.page) {
    const page = parseInt(query.page, 10);
    
    if (page < 1) {
      query.page = 1;
    } else if (page > MAX_PAGE_NUMBER) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'Page number too high'
      );
    }
  }
}

/** Middleware: Valida y sanitiza query parameters */
async function validateQueryParams(request, reply) {
  if (!request.query) return;

  // Sanitizar todos los query parameters
  Object.keys(request.query).forEach(key => {
    if (request.query[key]) {
      request.query[key] = sanitizeInput(request.query[key]);
    }
  });

  // Validar límites de paginación
  validatePaginationLimits(request.query);
}

/** Middleware: Valida y sanitiza el body de la request */
async function validateBody(request, reply) {
  if (!request.body) {
    throw new ErrorResponse(
      400,
      'Validation Error',
      'Request body is required'
    );
  }

  sanitizeObject(request.body);
}

module.exports = {
  sanitizeInput,
  validateQueryParams,
  validateBody
};

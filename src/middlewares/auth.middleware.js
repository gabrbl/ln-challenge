const { ErrorResponse } = require('../utils/errors');

const rateLimitMap = new Map();

// Configuración de rate limiting
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

/** Middleware de autenticación JWT - Verifica el token Bearer y valida su payload */
async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ErrorResponse(
      401,
      'Authentication Required',
      'Missing or invalid Authorization header'
    );
  }

  await request.jwtVerify();

  if (!request.user?.username) {
    throw new ErrorResponse(
      401,
      'Authentication Required',
      'Invalid token payload'
    );
  }
}

/** Middleware de rate limiting básico - Limita las peticiones por IP */
async function rateLimit(request, reply) {
  const ip = request.ip;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT_WINDOW_MS 
    });
    return;
  }

  const limit = rateLimitMap.get(ip);

  if (now > limit.resetTime) {
    // Ventana expirada, reiniciar contador
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    limit.count++;

    if (limit.count > RATE_LIMIT_MAX_REQUESTS) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      
      throw new ErrorResponse(
        429,
        'Too Many Requests',
        `Rate limit exceeded. Try again in ${retryAfter} seconds`
      );
    }
  }
}

/** Limpia entradas expiradas del mapa de rate limit */
function cleanupRateLimitMap() {
  const now = Date.now();
  
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

// Ejecutar limpieza periódica
setInterval(cleanupRateLimitMap, RATE_LIMIT_CLEANUP_INTERVAL_MS);

module.exports = { authenticate, rateLimit };

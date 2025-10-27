const { ErrorResponse } = require('../utils/errors');

class AuthController {
  constructor(fastify) {
    this.fastify = fastify;
  }

  /** Autentica un usuario y genera un token JWT */
  async login(request, reply) {
    const { username, password } = request.body;

    // Validación simple - en producción usar DB
    if (username === 'admin' && password === 'admin123') {
      const token = this.fastify.jwt.sign({
        username,
        role: 'admin'
      });

      return { token };
    }

    throw new ErrorResponse(
      401,
      'Authentication Failed',
      'Invalid credentials'
    );
  }
}

module.exports = AuthController;

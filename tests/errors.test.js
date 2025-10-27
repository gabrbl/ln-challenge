const { ErrorResponse } = require('../src/utils/errors');

describe('ErrorResponse', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ErrorResponse(400, 'Validation Error', 'Invalid input');
      
      expect(error.code).toBe(400);
      expect(error.message).toBe('Validation Error');
      expect(error.description).toBe('Invalid input');
    });
    
    it('should be instance of Error', () => {
      const error = new ErrorResponse(500, 'Server Error', 'Something went wrong');
      
      expect(error).toBeInstanceOf(Error);
    });
  });
  
  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const error = new ErrorResponse(404, 'Not Found', 'Resource does not exist');
      
      const json = error.toJSON();
      
      expect(json).toEqual({
        code: 404,
        message: 'Not Found',
        description: 'Resource does not exist'
      });
    });
    
    it('should work with different error codes', () => {
      const errors = [
        new ErrorResponse(400, 'Bad Request', 'Invalid data'),
        new ErrorResponse(401, 'Unauthorized', 'Missing token'),
        new ErrorResponse(403, 'Forbidden', 'Access denied'),
        new ErrorResponse(500, 'Internal Error', 'Server crashed')
      ];
      
      errors.forEach(error => {
        const json = error.toJSON();
        expect(json).toHaveProperty('code');
        expect(json).toHaveProperty('message');
        expect(json).toHaveProperty('description');
      });
    });
  });
  
  describe('error handling scenarios', () => {
    it('should represent out of stock error', () => {
      const error = new ErrorResponse(400, 'Validation Error', 'Out of Stock');
      
      expect(error.toJSON()).toEqual({
        code: 400,
        message: 'Validation Error',
        description: 'Out of Stock'
      });
    });
    
    it('should represent authentication error', () => {
      const error = new ErrorResponse(401, 'Authentication Failed', 'Invalid credentials');
      
      expect(error.toJSON()).toEqual({
        code: 401,
        message: 'Authentication Failed',
        description: 'Invalid credentials'
      });
    });
    
    it('should represent not found error', () => {
      const error = new ErrorResponse(404, 'Not Found', 'Product not found');
      
      expect(error.toJSON()).toEqual({
        code: 404,
        message: 'Not Found',
        description: 'Product not found'
      });
    });
  });
});

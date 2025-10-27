const ProductController = require('../src/controllers/product.controller');
const { ErrorResponse } = require('../src/utils/errors');

describe('ProductController', () => {
  let controller;
  let mockDb;
  let mockRequest;
  let mockReply;
  
  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };
    
    controller = new ProductController(mockDb);
    
    mockRequest = {
      query: {},
      params: {}
    };
    
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('search', () => {
    it('should return validation error if query is too short', async () => {
      mockRequest.query = { q: 'a' };
      
      await expect(controller.search(mockRequest, mockReply))
        .rejects.toThrow(ErrorResponse);
      
      try {
        await controller.search(mockRequest, mockReply);
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorResponse);
        expect(error.code).toBe(400);
        expect(error.message).toBe('Validation Error');
      }
    });
    
    it('should return search results with valid query', async () => {
      mockRequest.query = {
        q: 'samsung',
        orderBy: 'precio',
        order: 'DESC',
        page: 1,
        limit: 10
      };
      
      const mockResults = {
        data: [{ id: 1, sku: 'TV-001' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 }
      };
      
      // Mock the service method
      controller.productService.searchProducts = jest.fn().mockResolvedValue(mockResults);
      
      const result = await controller.search(mockRequest, mockReply);
      
      expect(result).toEqual(mockResults);
      expect(controller.productService.searchProducts).toHaveBeenCalledWith({
        query: 'samsung',
        orderBy: 'precio',
        order: 'DESC',
        page: 1,
        limit: 10
      });
    });
    
    it('should handle service errors', async () => {
      mockRequest.query = { q: 'test' };
      
      controller.productService.searchProducts = jest.fn()
        .mockRejectedValue(new Error('Database error'));
      
      await expect(controller.search(mockRequest, mockReply))
        .rejects.toThrow('Database error');
    });
  });
  
  describe('list', () => {
    it('should return list of products', async () => {
      mockRequest.query = {
        orderBy: 'created_at',
        order: 'DESC',
        page: 1,
        limit: 10
      };
      
      const mockResults = {
        data: [
          { id: 1, qty: 5, precio: 100 },
          { id: 2, qty: 10, precio: 200 }
        ],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 }
      };
      
      controller.productService.listProducts = jest.fn().mockResolvedValue(mockResults);
      
      const result = await controller.list(mockRequest, mockReply);
      
      expect(result).toEqual(mockResults);
    });
    
    it('should use default parameters if not provided', async () => {
      mockRequest.query = {};
      
      controller.productService.listProducts = jest.fn().mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      });
      
      await controller.list(mockRequest, mockReply);
      
      expect(controller.productService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: 'created_at',
          order: 'DESC',
          page: 1,
          limit: 10
        })
      );
    });
  });
  
  describe('getBySlug', () => {
    it('should return product details with slug', async () => {
      mockRequest.params = { slug: 'test-product' };
      
      const mockProduct = {
        id: 1,
        producto_categoria_id: 2,
        descripcion_larga: 'Test Product',
        precio: 100
      };
      
      const mockRelated = [
        { id: 2, descripcion_larga: 'Related 1' },
        { id: 3, descripcion_larga: 'Related 2' }
      ];
      
      controller.productService.getProductBySlug = jest.fn().mockResolvedValue(mockProduct);
      controller.productService.getRelatedProducts = jest.fn().mockResolvedValue(mockRelated);
      
      const result = await controller.getBySlug(mockRequest, mockReply);
      
      expect(result).toEqual({
        ...mockProduct,
        related: mockRelated
      });
    });
    
    it('should return 404 if product not found', async () => {
      mockRequest.params = { slug: 'non-existent' };
      
      controller.productService.getProductBySlug = jest.fn().mockResolvedValue(null);
      
      await expect(controller.getBySlug(mockRequest, mockReply))
        .rejects.toThrow(ErrorResponse);
      
      try {
        await controller.getBySlug(mockRequest, mockReply);
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorResponse);
        expect(error.code).toBe(404);
        expect(error.message).toBe('Not Found');
      }
    });
  });
});

const ProductService = require('../../src/services/product.service');
const { ErrorResponse } = require('../../src/utils/errors');

describe('ProductService', () => {
  let service;
  let mockDb;
  
  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };
    service = new ProductService(mockDb);
  });
  
  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [
        { 
          id: 1, 
          sku: 'TEST-001', 
          descripcion_corta: 'Test Product',
          descripcion_larga: 'Test Product Description',
          precio: '100',
          qty: '5'
        }
      ];
      
      mockDb.query
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ total: 1 }]);
      
      const result = await service.searchProducts({
        query: 'test',
        orderBy: 'created_at',
        order: 'DESC',
        page: 1,
        limit: 10
      });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('slug');
      expect(result.data[0].precio).toBe(100);
      expect(result.data[0].qty).toBe(5);
      expect(result.pagination.total).toBeLessThanOrEqual(10000);
    });
    
    it('should validate query length', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      await expect(service.searchProducts({
        query: 'a',
        page: 1,
        limit: 10
      })).rejects.toThrow(ErrorResponse);
      
      await expect(service.searchProducts({
        query: '',
        page: 1,
        limit: 10
      })).rejects.toThrow(ErrorResponse);
    });
    
    it('should validate query max length', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      const longQuery = 'a'.repeat(101);
      
      await expect(service.searchProducts({
        query: longQuery,
        page: 1,
        limit: 10
      })).rejects.toThrow(ErrorResponse);
    });
    
    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));
      
      // Ahora los errores de DB se propagan directamente
      await expect(service.searchProducts({
        query: 'test',
        page: 1,
        limit: 10
      })).rejects.toThrow('DB Error');
    });
    
    it('should handle null prices and quantities', async () => {
      const mockProducts = [
        { 
          id: 1,
          descripcion_larga: 'Product',
          precio: null,
          qty: null
        }
      ];
      
      mockDb.query
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ total: 1 }]);
      
      const result = await service.searchProducts({
        query: 'test',
        page: 1,
        limit: 10
      });
      
      expect(result.data[0].precio).toBe(0);
      expect(result.data[0].qty).toBe(0);
    });
  });
  
  describe('listProducts', () => {
    it('should list products with filters', async () => {
      const mockProducts = [{
        id: 1,
        descripcion_larga: 'Product',
        precio: '100.50',
        qty: '10'
      }];
      
      mockDb.query
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ total: 1 }]);
      
      const result = await service.listProducts({
        orderBy: 'precio',
        order: 'ASC',
        page: 1,
        limit: 10
      });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].precio).toBe(100.50);
      expect(result.data[0].qty).toBe(10);
    });
    
    it('should filter by category', async () => {
      mockDb.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);
      
      await service.listProducts({
        page: 1,
        limit: 10,
        category: 'TV'
      });
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('pc.codigo = ?'),
        expect.arrayContaining(['TV'])
      );
    });
  });
  
  describe('getProductBySlug', () => {
    const mockProducts = [{
      id: 1,
      descripcion_larga: 'Test Product Description',
      precio: '99.99',
      qty: '5',
      producto_categoria_id: 1
    }];
    
    it('should find product by slug', async () => {
      mockDb.query.mockResolvedValueOnce(mockProducts);
      
      const result = await service.getProductBySlug('test-product-description');
      
      expect(result).toBeTruthy();
      expect(result.slug).toBe('test-product-description');
      expect(result.precio).toBe(99.99);
      expect(result.qty).toBe(5);
    });
    
    it('should return null for non-existent slug', async () => {
      mockDb.query.mockResolvedValueOnce(mockProducts);
      
      const result = await service.getProductBySlug('non-existent');
      
      // El servicio refactorizado retorna null, no undefined
      expect(result).toBeNull();
    });
    
    it('should validate slug', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      await expect(service.getProductBySlug(''))
        .rejects.toThrow(ErrorResponse);
      
      await expect(service.getProductBySlug('a'.repeat(201)))
        .rejects.toThrow(ErrorResponse);
    });
    
    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));
      
      // Los errores de DB se propagan directamente
      await expect(service.getProductBySlug('test'))
        .rejects.toThrow('DB Error');
    });
  });
  
  describe('getRelatedProducts', () => {
    it('should return related products', async () => {
      const mockProducts = [
        { id: 2, descripcion_larga: 'Related 1', precio: '50' },
        { id: 3, descripcion_larga: 'Related 2', precio: '60' }
      ];
      
      mockDb.query.mockResolvedValueOnce(mockProducts);
      
      const result = await service.getRelatedProducts(1, 1, 4);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('slug');
      expect(result[0].precio).toBe(50);
    });
    
    it('should return empty array on invalid params', async () => {
      expect(await service.getRelatedProducts(null, 1)).toEqual([]);
      expect(await service.getRelatedProducts(1, null)).toEqual([]);
    });
    
    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));
      
      const result = await service.getRelatedProducts(1, 1);
      
      expect(result).toEqual([]);
    });
    
    it('should limit results', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      await service.getRelatedProducts(1, 1, 100);
      
      // El límite se aplica en la query SQL directamente, no en el array de parámetros
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10'),
        [1, 1]
      );
    });
  });
  
  describe('checkStock', () => {
    it('should return stock quantity', async () => {
      mockDb.query.mockResolvedValueOnce([{ qty: '10' }]);
      
      const stock = await service.checkStock(1);
      
      expect(stock).toBe(10);
    });
    
    it('should return 0 if product not found', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      const stock = await service.checkStock(999);
      
      expect(stock).toBe(0);
    });
    
    it('should return 0 for invalid product ID', async () => {
      expect(await service.checkStock(null)).toBe(0);
      expect(await service.checkStock(0)).toBe(0);
      expect(await service.checkStock(-1)).toBe(0);
    });
    
    it('should handle negative stock as 0', async () => {
      mockDb.query.mockResolvedValueOnce([{ qty: '-5' }]);
      
      const stock = await service.checkStock(1);
      
      expect(stock).toBe(0);
    });
    
    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));
      
      const stock = await service.checkStock(1);
      
      expect(stock).toBe(0);
    });
  });
});

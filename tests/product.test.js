const ProductService = require('../src/services/product.service');

describe('ProductService', () => {
  let service;
  let mockDb;
  
  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      transaction: jest.fn()
    };
    service = new ProductService(mockDb);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [
        { 
          id: 1, 
          sku: 'TEST-001', 
          descripcion_corta: 'Test Product',
          descripcion_larga: 'Test Product Description',
          qty: 10,
          precio: 100.00
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
      
      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
    
    it('should search with custom order by precio', async () => {
      const mockProducts = [];
      
      mockDb.query
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ total: 0 }]);
      
      const result = await service.searchProducts({
        query: 'test',
        orderBy: 'precio',
        order: 'ASC',
        page: 2,
        limit: 5
      });
      
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });
  });
  
  describe('listProducts', () => {
    it('should list products with filters applied', async () => {
      const mockProducts = [
        { 
          id: 1, 
          sku: 'PROD-001',
          qty: 5,
          precio: 150.00,
          producto_estado_id: 3,
          ubicacion_imagen: '/images/test.jpg'
        }
      ];
      
      mockDb.query
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ total: 1 }]);
      
      const result = await service.listProducts({
        orderBy: 'precio',
        order: 'DESC',
        page: 1,
        limit: 10
      });
      
      expect(result.data).toEqual(mockProducts);
      expect(result.data.length).toBeGreaterThan(0);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
    
    it('should filter by category if provided', async () => {
      mockDb.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);
      
      await service.listProducts({
        orderBy: 'created_at',
        order: 'DESC',
        page: 1,
        limit: 10,
        category: 'TV'
      });
      
      expect(mockDb.query).toHaveBeenCalled();
    });
  });
  
  describe('getProductBySlug', () => {
    it('should return product matching slug', async () => {
      const mockProducts = [
        {
          id: 1,
          descripcion_larga: 'Televisor Samsung QLED 55 pulgadas',
          sku: 'TV-001',
          precio: 1200.00
        }
      ];
      
      mockDb.query.mockResolvedValueOnce(mockProducts);
      
      const result = await service.getProductBySlug('televisor-samsung-qled-55-pulgadas');
      
      expect(result).toBeDefined();
      expect(result.slug).toBe('televisor-samsung-qled-55-pulgadas');
    });
    
    it('should return null if slug not found', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      const result = await service.getProductBySlug('producto-inexistente');
      
      // El servicio refactorizado retorna null, no undefined
      expect(result).toBeNull();
    });
  });
  
  describe('getRelatedProducts', () => {
    it('should return related products from same category', async () => {
      const mockRelated = [
        { id: 2, descripcion_larga: 'Producto Relacionado 1' },
        { id: 3, descripcion_larga: 'Producto Relacionado 2' }
      ];
      
      mockDb.query.mockResolvedValueOnce(mockRelated);
      
      const result = await service.getRelatedProducts(1, 1, 4);
      
      expect(result).toEqual(mockRelated);
      expect(result.length).toBeLessThanOrEqual(4);
      expect(mockDb.query).toHaveBeenCalled();
    });
  });
  
  describe('checkStock', () => {
    it('should return stock quantity', async () => {
      mockDb.query.mockResolvedValueOnce([{ qty: 10 }]);
      
      const stock = await service.checkStock(1);
      
      expect(stock).toBe(10);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT qty FROM productos WHERE id = ? AND producto_estado_id'),
        [1]
      );
    });
    
    it('should return 0 if product not found', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      const stock = await service.checkStock(999);
      
      expect(stock).toBe(0);
    });
    
    it('should handle null stock', async () => {
      mockDb.query.mockResolvedValueOnce([{ qty: null }]);
      
      const stock = await service.checkStock(1);
      
      // El servicio refactorizado convierte null a 0
      expect(stock).toBe(0);
    });
  });
});

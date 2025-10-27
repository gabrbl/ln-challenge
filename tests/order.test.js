const OrderService = require('../src/services/order.service');
const { ErrorResponse } = require('../src/utils/errors');

describe('OrderService', () => {
  let service;
  let mockDb;
  
  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      transaction: jest.fn()
    };
    service = new OrderService(mockDb);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('listOrders', () => {
    it('should list all orders without filters', async () => {
      const mockOrders = [
        {
          id: 1,
          fecha_circulacion: '2024-06-15 10:30:00',
          precio: 1200.00,
          cuit: '20-12345678-9',
          sku: 'TV-001'
        }
      ];
      
      mockDb.query.mockResolvedValueOnce(mockOrders);
      
      const result = await service.listOrders({});
      
      expect(result).toEqual(mockOrders);
      expect(mockDb.query).toHaveBeenCalled();
    });
    
    it('should filter orders by order_id', async () => {
      const mockOrders = [
        { id: 1, precio: 100.00 }
      ];
      
      mockDb.query.mockResolvedValueOnce(mockOrders);
      
      const result = await service.listOrders({ orderId: 1 });
      
      expect(result).toEqual(mockOrders);
    });
    
    it('should filter orders by CUIT', async () => {
      const mockOrders = [
        { id: 1, cuit: '20-12345678-9' }
      ];
      
      mockDb.query.mockResolvedValueOnce(mockOrders);
      
      const result = await service.listOrders({ cuit: '20-12345678-9' });
      
      expect(result).toEqual(mockOrders);
    });
    
    it('should filter orders by date range', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      await service.listOrders({
        createdAtMin: '2024-06-01T00:00:00',
        createdAtMax: '2024-12-31T23:59:59'
      });
      
      expect(mockDb.query).toHaveBeenCalled();
    });
  });
  
  describe('createOrder', () => {
    it('should create order successfully with sufficient stock', async () => {
      const orderData = {
        cliente_id: 1,
        producto_id: 1,
        cantidad_solicitada: 2,
        clase_entrega: 'Express',
        condicion_pago_aplicada: 'Contado'
      };
      
      const mockConnection = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ qty: 10, id: 1 }]]) // Check product and stock
          .mockResolvedValueOnce([[{ precio: 100.00 }]]) // Get current price
          .mockResolvedValueOnce([[{ next_numero: 1007 }]]) // Get next order number
          .mockResolvedValueOnce([{ insertId: 1 }]) // Insert order
          .mockResolvedValueOnce([]) // Update stock
          .mockResolvedValueOnce([[{ 
            id: 1,
            numero_orden: 1007,
            precio: '200.00',
            cantidad_solicitada: '2'
          }]]), // Get created order
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      
      mockDb.transaction.mockImplementation(async (callback) => {
        await mockConnection.beginTransaction();
        try {
          const result = await callback(mockConnection);
          await mockConnection.commit();
          return result;
        } catch (error) {
          await mockConnection.rollback();
          throw error;
        } finally {
          await mockConnection.release();
        }
      });
      
      const result = await service.createOrder(orderData);
      
      expect(result).toHaveProperty('numero_orden');
      expect(result.numero_orden).toBe(1007);
      expect(mockConnection.execute).toHaveBeenCalledTimes(6); // sin verificación de cliente
    });
    
    it('should throw error if required fields are missing', async () => {
      const invalidOrder = {
        cliente_id: 1
        // Missing producto_id and cantidad_solicitada
      };
      
      await expect(service.createOrder(invalidOrder))
        .rejects
        .toThrow(ErrorResponse);
    });
  });
});

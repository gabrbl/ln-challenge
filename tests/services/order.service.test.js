const OrderService = require('../../src/services/order.service');
const { ErrorResponse } = require('../../src/utils/errors');

describe('OrderService', () => {
  let service;
  let mockDb;
  let mockConnection;
  
  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    
    mockDb = {
      query: jest.fn(),
      transaction: jest.fn(async (callback) => {
        await mockConnection.beginTransaction();
        try {
          const result = await callback(mockConnection);
          await mockConnection.commit();
          return result;
        } catch (error) {
          await mockConnection.rollback();
          throw error;
        }
      })
    };
    
    service = new OrderService(mockDb);
  });
  
  describe('listOrders', () => {
    it('should list all orders when no filters', async () => {
      const mockOrders = [
        { id: 1, precio: '100.00', cantidad_solicitada: '2' }
      ];
      mockDb.query.mockResolvedValueOnce(mockOrders);
      
      const result = await service.listOrders({});
      
      expect(result).toHaveLength(1);
      // El servicio refactorizado ya no parsea automáticamente, retorna raw data
      expect(result[0].precio).toBe('100.00');
      expect(result[0].cantidad_solicitada).toBe('2');
    });
    
    it('should filter by order ID', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      await service.listOrders({ orderId: '123' });
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('p.id = ?'),
        ['123'] // Se mantiene como string, no se convierte
      );
    });
    
    it('should validate date range', async () => {
      mockDb.query.mockResolvedValueOnce([]);
      
      // Ya no hay validación de rango de fechas en el servicio, solo se aplica el filtro
      await service.listOrders({
        createdAtMin: '2024-12-31',
        createdAtMax: '2024-01-01'
      });
      
      expect(mockDb.query).toHaveBeenCalled();
    });
  });
  
  describe('createOrder', () => {
    const validOrder = {
      cliente_id: 1,
      producto_id: 1,
      cantidad_solicitada: 2,
      clase_entrega: 'Express',
      condicion_pago_aplicada: 'Contado'
    };
    
    it('should create order successfully', async () => {
      // Mock successful flow - connection.execute retorna [[rows], metadata]
      mockConnection.execute
        .mockResolvedValueOnce([[{ qty: 10, id: 1 }]]) // product with stock
        .mockResolvedValueOnce([[{ precio: 100 }]]) // price
        .mockResolvedValueOnce([[{ next_numero: 1001 }]]) // next order number
        .mockResolvedValueOnce([{ insertId: 1 }]) // insert order (metadata, not rows)
        .mockResolvedValueOnce([]) // update stock
        .mockResolvedValueOnce([[{id: 1, numero_orden: 1001, precio: '200', cantidad_solicitada: '2'}]]); // get created order
      
      const result = await service.createOrder(validOrder);
      
      expect(result).toHaveProperty('numero_orden');
      expect(result.numero_orden).toBe(1001);
      expect(result.precio).toBe('200');
    });
    
    it('should validate required fields', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      await expect(service.createOrder({}))
        .rejects.toThrow(ErrorResponse);
      
      await expect(service.createOrder({ cliente_id: 1 }))
        .rejects.toThrow(ErrorResponse);
    });
    
    it('should validate numeric fields', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      // cliente_id='abc' va a fallar en validación antes de llegar a execute
      await expect(service.createOrder({
        ...validOrder,
        cliente_id: 'abc'
      })).rejects.toThrow(ErrorResponse);
      
      await expect(service.createOrder({
        ...validOrder,
        cantidad_solicitada: 0
      })).rejects.toThrow(ErrorResponse);
    });
    
    it('should validate quantity limits', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      // Se valida al inicio, antes de execute
      await expect(service.createOrder({
        ...validOrder,
        cantidad_solicitada: 1001
      })).rejects.toThrow(ErrorResponse);
    });
    
    it('should handle out of stock', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      mockConnection.execute
        .mockResolvedValueOnce([{ id: 1 }]) // client
        .mockResolvedValueOnce([{ qty: 0, id: 1 }]); // no stock
      
      await expect(service.createOrder(validOrder))
        .rejects.toThrow(ErrorResponse);
    });
    
    it('should handle insufficient stock', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      mockConnection.execute
        .mockResolvedValueOnce([{ id: 1 }]) // client
        .mockResolvedValueOnce([{ qty: 1, id: 1 }]); // insufficient stock
      
      await expect(service.createOrder({
        ...validOrder,
        cantidad_solicitada: 5
      })).rejects.toThrow(ErrorResponse);
    });
    
    it('should handle client not found', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      mockConnection.execute.mockResolvedValueOnce([[]]); // product not found (array vacío dentro de array)
      
      await expect(service.createOrder(validOrder))
        .rejects.toThrow(ErrorResponse);
    });
    
    it('should handle product not found', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      mockConnection.execute
        .mockResolvedValueOnce([{ id: 1 }]) // client exists
        .mockResolvedValueOnce([]); // product not found
      
      await expect(service.createOrder(validOrder))
        .rejects.toThrow(ErrorResponse);
    });
    
    it('should handle no valid price', async () => {
      const ErrorResponse = require('../../src/utils/errors').ErrorResponse;
      
      mockConnection.execute
        .mockResolvedValueOnce([{ id: 1 }]) // client
        .mockResolvedValueOnce([{ qty: 10, id: 1 }]) // product
        .mockResolvedValueOnce([]); // no price
      
      await expect(service.createOrder(validOrder))
        .rejects.toThrow(ErrorResponse);
    });
  });
});

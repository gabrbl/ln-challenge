const OrderController = require('../src/controllers/order.controller');
const { ErrorResponse } = require('../src/utils/errors');

describe('OrderController', () => {
  let controller;
  let mockDb;
  let mockRequest;
  let mockReply;
  
  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      transaction: jest.fn()
    };
    
    controller = new OrderController(mockDb);
    
    mockRequest = {
      query: {},
      body: {}
    };
    
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('list', () => {
    it('should return list of orders', async () => {
      const mockOrders = [
        { id: 1, precio: 100, cuit: '20-12345678-9' },
        { id: 2, precio: 200, cuit: '27-98765432-1' }
      ];
      
      controller.orderService.listOrders = jest.fn().mockResolvedValue(mockOrders);
      
      const result = await controller.list(mockRequest, mockReply);
      
      expect(result).toEqual(mockOrders);
    });
    
    it('should filter orders by query parameters', async () => {
      mockRequest.query = {
        order_id: 1,
        cuit: '20-12345678-9',
        created_at_min: '2024-01-01T00:00:00',
        created_at_max: '2024-12-31T23:59:59'
      };
      
      controller.orderService.listOrders = jest.fn().mockResolvedValue([]);
      
      await controller.list(mockRequest, mockReply);
      
      expect(controller.orderService.listOrders).toHaveBeenCalledWith({
        orderId: 1,
        cuit: '20-12345678-9',
        createdAtMin: '2024-01-01T00:00:00',
        createdAtMax: '2024-12-31T23:59:59'
      });
    });
    
    it('should handle errors gracefully', async () => {
      controller.orderService.listOrders = jest.fn()
        .mockRejectedValue(new Error('Database error'));
      
      await expect(controller.list(mockRequest, mockReply))
        .rejects.toThrow('Database error');
    });
  });
  
  describe('create', () => {
    it('should create order successfully', async () => {
      mockRequest.body = {
        cliente_id: 1,
        producto_id: 1,
        cantidad_solicitada: 2,
        clase_entrega: 'Express',
        condicion_pago_aplicada: 'Contado'
      };
      
      const mockCreatedOrder = {
        id: 1,
        precio: 200.00,
        cantidad_solicitada: 2
      };
      
      controller.orderService.createOrder = jest.fn().mockResolvedValue(mockCreatedOrder);
      
      const result = await controller.create(mockRequest, mockReply);
      
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(result).toEqual(mockCreatedOrder);
    });
    
    it('should return 400 for validation errors', async () => {
      mockRequest.body = {
        cliente_id: 1,
        producto_id: 1,
        cantidad_solicitada: 1
      };
      
      const error = new ErrorResponse(400, 'Validation Error', 'Out of Stock');
      controller.orderService.createOrder = jest.fn().mockRejectedValue(error);
      
      await expect(controller.create(mockRequest, mockReply))
        .rejects.toThrow(ErrorResponse);
      
      try {
        await controller.create(mockRequest, mockReply);
      } catch (err) {
        expect(err).toBeInstanceOf(ErrorResponse);
        expect(err.code).toBe(400);
        expect(err.description).toBe('Out of Stock');
      }
    });
    
    it('should handle internal server errors', async () => {
      mockRequest.body = {
        cliente_id: 1,
        producto_id: 1,
        cantidad_solicitada: 1
      };
      
      controller.orderService.createOrder = jest.fn()
        .mockRejectedValue(new Error('Unexpected error'));
      
      await expect(controller.create(mockRequest, mockReply))
        .rejects.toThrow('Unexpected error');
    });
  });
});

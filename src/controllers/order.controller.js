const OrderService = require('../services/order.service');

class OrderController {
  constructor(db) {
    this.orderService = new OrderService(db);
  }

  /** Lista órdenes con filtros opcionales */
  async list(request, reply) {
    const { order_id, cuit, created_at_min, created_at_max } = request.query;

    const orders = await this.orderService.listOrders({
      orderId: order_id,
      cuit,
      createdAtMin: created_at_min,
      createdAtMax: created_at_max
    });

    return orders;
  }

  /** Crea una nueva orden de pedido */
  async create(request, reply) {
    const order = await this.orderService.createOrder(request.body);
    
    reply.code(201);
    return order;
  }
}

module.exports = OrderController;

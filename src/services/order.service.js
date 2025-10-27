const { ErrorResponse } = require('../utils/errors');


const DEFAULT_ORDER_START_NUMBER = 1001;

/** Servicio de órdenes - Maneja la lógica de negocio relacionada con pedidos */
class OrderService {
  constructor(db) {
    this.db = db;
  }

  /** Construye cláusulas WHERE dinámicas para filtros */
  _buildWhereClauses(filters) {
    const { orderId, cuit, createdAtMin, createdAtMax } = filters;
    const whereClauses = [];
    const params = [];

    if (orderId) {
      whereClauses.push('p.id = ?');
      params.push(orderId);
    }

    if (cuit) {
      whereClauses.push('c.cuit = ?');
      params.push(cuit);
    }

    if (createdAtMin) {
      whereClauses.push('p.fecha_circulacion >= ?');
      params.push(createdAtMin);
    }

    if (createdAtMax) {
      whereClauses.push('p.fecha_circulacion <= ?');
      params.push(createdAtMax);
    }

    return { whereClauses, params };
  }

  /** Lista órdenes con filtros opcionales */
  async listOrders(filters) {
    const { whereClauses, params } = this._buildWhereClauses(filters);
    const whereStr = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';

    const sql = `
      SELECT 
        p.id,
        p.numero_orden,
        p.fecha_circulacion,
        p.precio,
        p.clase_entrega,
        p.condicion_pago_aplicada,
        p.cantidad_solicitada,
        c.nombre,
        c.apellido,
        c.cuit,
        c.domicilio,
        pr.sku,
        pr.descripcion_corta
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      INNER JOIN productos pr ON p.producto_id = pr.id
      ${whereStr}
      ORDER BY p.fecha_circulacion DESC
    `;

    return this.db.query(sql, params);
  }

  /** Valida los datos de la orden */
  _validateOrderData(orderData) {
    const { cliente_id, producto_id, cantidad_solicitada } = orderData;

    if (!cliente_id || !producto_id || !cantidad_solicitada) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'Missing required fields: cliente_id, producto_id, cantidad_solicitada'
      );
    }

    if (typeof cliente_id !== 'number' || cliente_id <= 0) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'cliente_id must be a positive number'
      );
    }

    if (typeof producto_id !== 'number' || producto_id <= 0) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'producto_id must be a positive number'
      );
    }

    if (typeof cantidad_solicitada !== 'number' || cantidad_solicitada <= 0) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'cantidad_solicitada must be greater than 0'
      );
    }

    if (cantidad_solicitada > 1000) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'cantidad_solicitada exceeds maximum allowed (1000)'
      );
    }
  }

  /** Verifica el stock disponible del producto */
  async _checkProductStock(connection, producto_id, cantidad_solicitada) {
    const [rows] = await connection.execute(
      'SELECT qty, id FROM productos WHERE id = ? FOR UPDATE',
      [producto_id]
    );

    const product = rows[0];
    if (!product) {
      throw new ErrorResponse(404, 'Not Found', 'Product not found');
    }

    if (!product.qty || product.qty === 0) {
      throw new ErrorResponse(400, 'Validation Error', 'Out of Stock');
    }

    if (product.qty < cantidad_solicitada) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        `Insufficient stock. Available: ${product.qty}`
      );
    }

    return product;
  }

  /** Obtiene el precio actual del producto */
  async _getCurrentPrice(connection, producto_id) {
    const [rows] = await connection.execute(
      `SELECT precio FROM lista_precios 
       WHERE producto_id = ? 
       AND NOW() BETWEEN fecha_desde AND fecha_hasta 
       LIMIT 1`,
      [producto_id]
    );

    const price = rows[0];
    if (!price) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'Product has no valid price'
      );
    }

    return price.precio;
  }

  /** Genera el siguiente número de orden */
  async _getNextOrderNumber(connection) {
    const [rows] = await connection.execute(
      'SELECT COALESCE(MAX(numero_orden), ?) + 1 as next_numero FROM pedidos',
      [DEFAULT_ORDER_START_NUMBER - 1]
    );

    return rows[0]?.next_numero || DEFAULT_ORDER_START_NUMBER;
  }

  /** Inserta la orden en la base de datos */
  async _insertOrder(connection, orderData, numeroOrden, totalPrice) {
    const {
      producto_id,
      cliente_id,
      cantidad_solicitada,
      clase_entrega,
      condicion_pago_aplicada
    } = orderData;

    const [result] = await connection.execute(
      `INSERT INTO pedidos (
        numero_orden,
        fecha_circulacion, 
        precio, 
        clase_entrega, 
        condicion_pago_aplicada,
        id_cliente, 
        producto_id, 
        cliente_id, 
        cantidad_solicitada
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        numeroOrden,
        totalPrice,
        clase_entrega ?? null,
        condicion_pago_aplicada ?? null,
        null,
        producto_id,
        cliente_id,
        cantidad_solicitada
      ]
    );

    return result.insertId;
  }

  /** Actualiza el stock del producto */
  async _updateProductStock(connection, producto_id, cantidad_solicitada) {
    await connection.execute(
      'UPDATE productos SET qty = qty - ? WHERE id = ?',
      [cantidad_solicitada, producto_id]
    );
  }

  /** Obtiene la orden creada completa */
  async _getCreatedOrder(connection, orderId) {
    const [rows] = await connection.execute(
      `SELECT 
        p.id,
        p.numero_orden,
        p.fecha_circulacion,
        p.precio,
        p.clase_entrega,
        p.condicion_pago_aplicada,
        p.cantidad_solicitada,
        c.nombre,
        c.apellido,
        c.cuit,
        pr.sku,
        pr.descripcion_corta
      FROM pedidos p
      INNER JOIN clientes c ON p.cliente_id = c.id
      INNER JOIN productos pr ON p.producto_id = pr.id
      WHERE p.id = ?`,
      [orderId]
    );

    return rows[0];
  }

  /** Crea una nueva orden de pedido */
  async createOrder(orderData) {
    this._validateOrderData(orderData);

    const { producto_id, cantidad_solicitada } = orderData;

    return this.db.transaction(async (connection) => {
      // Verificar stock
      await this._checkProductStock(connection, producto_id, cantidad_solicitada);

      // Obtener precio actual
      const precio = await this._getCurrentPrice(connection, producto_id);
      const totalPrice = precio * cantidad_solicitada;

      // Generar número de orden
      const numeroOrden = await this._getNextOrderNumber(connection);

      // Insertar orden
      const orderId = await this._insertOrder(
        connection,
        orderData,
        numeroOrden,
        totalPrice
      );

      // Actualizar stock
      await this._updateProductStock(connection, producto_id, cantidad_solicitada);

      // Obtener orden creada
      return this._getCreatedOrder(connection, orderId);
    });
  }
}

module.exports = OrderService;

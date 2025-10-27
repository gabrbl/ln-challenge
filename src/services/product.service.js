const { generateSlug } = require('../utils/slug');
const { ErrorResponse } = require('../utils/errors');

// Constantes de validación
const MAX_SEARCH_QUERY_LENGTH = 100;
const MIN_SEARCH_QUERY_LENGTH = 2;
const MAX_OFFSET = 10000;
const MAX_SLUG_LENGTH = 200;
const DEFAULT_RELATED_PRODUCTS_LIMIT = 4;
const MAX_RELATED_PRODUCTS_LIMIT = 10;

/** Servicio de productos - Maneja la lógica de negocio relacionada con productos */
class ProductService {
  constructor(db) {
    this.db = db;
  }

  /** Valida parámetros de paginación */
  _validatePaginationParams({ page, limit }) {
    const offset = (page - 1) * limit;

    if (offset > MAX_OFFSET) {
      throw new ErrorResponse(400, 'Validation Error', 'Page number too high');
    }

    const safeLimit = parseInt(limit, 10);
    const safeOffset = parseInt(offset, 10);

    if (isNaN(safeLimit) || isNaN(safeOffset) || safeLimit < 1 || safeOffset < 0) {
      throw new ErrorResponse(400, 'Validation Error', 'Invalid pagination parameters');
    }

    return { safeLimit, safeOffset };
  }

  /** Obtiene el campo de ordenamiento SQL correcto */
  _getOrderByField(orderBy) {
    const orderByMap = {
      categoria: 'pc.descripcion',
      precio: 'precio',
      created_at: 'p.created_at'
    };

    return orderByMap[orderBy] || 'p.created_at';
  }

  /** Normaliza el orden (ASC/DESC) */
  _normalizeOrder(order) {
    return order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  }

  /** Agrega slug y normaliza datos del producto */
  _enrichProduct(product) {
    product.slug = generateSlug(product.descripcion_corta || product.descripcion_larga);
    product.precio = parseFloat(product.precio) || 0;
    product.qty = Math.max(0, parseInt(product.qty, 10) || 0);
  }

  /** Busca productos por término de búsqueda */
  async searchProducts({ query, orderBy, order, page, limit }) {
    // Validaciones
    if (!query || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        `Search query must be at least ${MIN_SEARCH_QUERY_LENGTH} characters`
      );
    }

    if (query.length > MAX_SEARCH_QUERY_LENGTH) {
      throw new ErrorResponse(400, 'Validation Error', 'Search query too long');
    }

    const { safeLimit, safeOffset } = this._validatePaginationParams({ page, limit });
    const orderByField = this._getOrderByField(orderBy);
    const orderDir = this._normalizeOrder(order);

    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.descripcion_corta,
        p.descripcion_larga,
        p.qty,
        p.ubicacion_imagen,
        p.created_at,
        pc.descripcion as categoria,
        pt.descripcion as tipo,
        COALESCE(lp.precio, 0) as precio,
        pe.descripcion as estado
      FROM productos p
      INNER JOIN producto_categoria pc ON p.producto_categoria_id = pc.id
      INNER JOIN producto_tipo pt ON p.producto_tipo_id = pt.id
      INNER JOIN producto_estado pe ON p.producto_estado_id = pe.id
      LEFT JOIN lista_precios lp ON p.id = lp.producto_id 
        AND NOW() BETWEEN lp.fecha_desde AND lp.fecha_hasta
      WHERE (p.sku LIKE ? OR p.descripcion_corta LIKE ? OR p.descripcion_larga LIKE ?)
      ORDER BY ${orderByField} ${orderDir}
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const searchTerm = `%${query}%`;
    const products = await this.db.query(sql, [searchTerm, searchTerm, searchTerm]);

    // Enriquecer productos con slug y datos normalizados
    products.forEach(product => this._enrichProduct(product));

    // Contar total
    const countSql = `
      SELECT COUNT(*) as total
      FROM productos p
      WHERE (p.sku LIKE ? OR p.descripcion_corta LIKE ? OR p.descripcion_larga LIKE ?)
    `;
    
    const [{ total }] = await this.db.query(countSql, [searchTerm, searchTerm, searchTerm]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 0
      }
    };
  }

  /** Lista productos con filtros opcionales */
  async listProducts({ orderBy, order, page, limit, category }) {
    const { safeLimit, safeOffset } = this._validatePaginationParams({ page, limit });
    const orderField = this._getOrderByField(orderBy);
    const orderDir = this._normalizeOrder(order);

    const whereClauses = [
      'p.qty > 0',
      'p.producto_estado_id = 3',
      'p.ubicacion_imagen IS NOT NULL',
      "p.ubicacion_imagen != ''",
      'lp.precio > 0'
    ];

    const params = [];

    if (category) {
      if (category.length > MAX_SLUG_LENGTH) {
        throw new ErrorResponse(400, 'Validation Error', 'Category code too long');
      }
      whereClauses.push('pc.codigo = ?');
      params.push(category);
    }

    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.descripcion_corta,
        p.descripcion_larga,
        p.qty,
        p.ubicacion_imagen,
        p.created_at,
        pc.descripcion as categoria,
        pc.codigo as categoria_codigo,
        pt.descripcion as tipo,
        COALESCE(lp.precio, 0) as precio,
        pe.descripcion as estado
      FROM productos p
      INNER JOIN producto_categoria pc ON p.producto_categoria_id = pc.id
      INNER JOIN producto_tipo pt ON p.producto_tipo_id = pt.id
      INNER JOIN producto_estado pe ON p.producto_estado_id = pe.id
      INNER JOIN lista_precios lp ON p.id = lp.producto_id 
        AND NOW() BETWEEN lp.fecha_desde AND lp.fecha_hasta
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY ${orderField === 'precio' ? 'lp.precio' : orderField} ${orderDir}
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const products = await this.db.query(sql, params);

    // Enriquecer productos
    products.forEach(product => {
      product.slug = generateSlug(product.descripcion_larga);
      product.precio = parseFloat(product.precio) || 0;
      product.qty = Math.max(0, parseInt(product.qty, 10) || 0);
    });

    // Contar total con límite
    const countSql = `
      SELECT COUNT(*) as total
      FROM (
        SELECT 1
        FROM productos p
        INNER JOIN producto_categoria pc ON p.producto_categoria_id = pc.id
        INNER JOIN lista_precios lp ON p.id = lp.producto_id 
          AND NOW() BETWEEN lp.fecha_desde AND lp.fecha_hasta
        WHERE ${whereClauses.join(' AND ')}
        LIMIT ${MAX_OFFSET}
      ) as limited_count
    `;

    const [{ total }] = await this.db.query(countSql, category ? [category] : []);
    const limitedTotal = Math.min(total, MAX_OFFSET);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total: limitedTotal,
        pages: Math.ceil(limitedTotal / limit)
      }
    };
  }

  /** Obtiene un producto por su slug */
  async getProductBySlug(slug) {
    if (!slug || slug.length > MAX_SLUG_LENGTH) {
      throw new ErrorResponse(400, 'Validation Error', 'Invalid slug');
    }

    const sql = `
      SELECT 
        p.*,
        pc.descripcion as categoria,
        pc.codigo as categoria_codigo,
        pt.descripcion as tipo,
        COALESCE(lp.precio, 0) as precio,
        pe.descripcion as estado
      FROM productos p
      INNER JOIN producto_categoria pc ON p.producto_categoria_id = pc.id
      INNER JOIN producto_tipo pt ON p.producto_tipo_id = pt.id
      INNER JOIN producto_estado pe ON p.producto_estado_id = pe.id
      LEFT JOIN lista_precios lp ON p.id = lp.producto_id 
        AND NOW() BETWEEN lp.fecha_desde AND lp.fecha_hasta
      WHERE p.producto_estado_id = 3
    `;

    const products = await this.db.query(sql);

    // Buscar producto que coincida con el slug
    const product = products.find(p => 
      generateSlug(p.descripcion_larga) === slug
    );

    if (product) {
      product.slug = slug;
      product.precio = parseFloat(product.precio) || 0;
      product.qty = Math.max(0, parseInt(product.qty, 10) || 0);
    }

    return product || null;
  }

  /** Obtiene productos relacionados por categoría */
  async getRelatedProducts(productId, categoryId, limit = DEFAULT_RELATED_PRODUCTS_LIMIT) {
    if (!productId || !categoryId) {
      return [];
    }

    const safeLimit = Math.min(
      parseInt(limit, 10) || DEFAULT_RELATED_PRODUCTS_LIMIT,
      MAX_RELATED_PRODUCTS_LIMIT
    );

    if (isNaN(safeLimit) || safeLimit < 1) {
      return [];
    }

    const sql = `
      SELECT 
        p.id,
        p.sku,
        p.descripcion_corta,
        p.descripcion_larga,
        p.qty,
        p.ubicacion_imagen,
        COALESCE(lp.precio, 0) as precio
      FROM productos p
      LEFT JOIN lista_precios lp ON p.id = lp.producto_id 
        AND NOW() BETWEEN lp.fecha_desde AND lp.fecha_hasta
      WHERE p.producto_categoria_id = ? 
        AND p.id != ?
        AND p.qty > 0
        AND p.producto_estado_id = 3
        AND p.ubicacion_imagen IS NOT NULL
      ORDER BY RAND()
      LIMIT ${safeLimit}
    `;

    try {
      const products = await this.db.query(sql, [categoryId, productId]);

      products.forEach(product => {
        product.slug = generateSlug(product.descripcion_larga);
        product.precio = parseFloat(product.precio) || 0;
      });

      return products;
    } catch (error) {
      // Log error pero devolver array vacío en lugar de fallar
      return [];
    }
  }

  /** Verifica el stock disponible de un producto */
  async checkStock(productId) {
    if (!productId || productId <= 0) {
      return 0;
    }

    try {
      const [product] = await this.db.query(
        'SELECT qty FROM productos WHERE id = ? AND producto_estado_id = 3',
        [productId]
      );

      return product ? Math.max(0, parseInt(product.qty, 10) || 0) : 0;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = ProductService;

const ProductService = require('../services/product.service');
const { ErrorResponse } = require('../utils/errors');

/** Controlador de productos - Gestiona las operaciones de búsqueda, listado y consulta de productos */
class ProductController {
  constructor(db) {
    this.productService = new ProductService(db);
  }

  /** Construye parámetros de paginación con valores por defecto */
  _buildPaginationParams(query) {
    return {
      orderBy: query.orderBy || 'created_at',
      order: query.order || 'DESC',
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 10
    };
  }

  /** Busca productos por término de búsqueda */
  async search(request, reply) {
    const { q, ...queryParams } = request.query;

    // Validación adicional
    if (!q || q.trim().length < 2) {
      throw new ErrorResponse(
        400,
        'Validation Error',
        'Search query must be at least 2 characters'
      );
    }

    const paginationParams = this._buildPaginationParams(queryParams);
    const products = await this.productService.searchProducts({
      query: q,
      ...paginationParams
    });

    return products;
  }

  /** Lista productos con filtros opcionales */
  async list(request, reply) {
    const { category, ...queryParams } = request.query;

    const paginationParams = this._buildPaginationParams(queryParams);
    const products = await this.productService.listProducts({
      ...paginationParams,
      category
    });

    return products;
  }

  /** Obtiene un producto por su slug, incluyendo productos relacionados */
  async getBySlug(request, reply) {
    const { slug } = request.params;

    const product = await this.productService.getProductBySlug(slug);

    if (!product) {
      throw new ErrorResponse(404, 'Not Found', 'Product not found');
    }

    const related = await this._getRelatedProducts(product);

    return {
      ...product,
      related
    };
  }

  /** Obtiene productos relacionados si hay información suficiente */
  async _getRelatedProducts(product) {
    if (!product.id || !product.producto_categoria_id) {
      return [];
    }

    return this.productService.getRelatedProducts(
      product.id,
      product.producto_categoria_id
    );
  }
}

module.exports = ProductController;

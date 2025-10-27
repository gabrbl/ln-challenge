# API para catalogo - LN challenge

API REST para gestión de catálogo de productos y pedidos construida con Fastify y MySQL.

## Requisitos

- Docker
- Docker Compose

## Ejecución

Iniciar el proyecto:

```bash
docker-compose up -d
```

Detener el proyecto:

```bash
docker-compose down
```

Ver logs:

```bash
docker-compose logs -f app
```

## Acceso

- API: http://localhost:3000
- Documentación: http://localhost:3000/documentation

## Endpoints Principales

### Productos
- `GET /api/products/search` - Búsqueda de productos
- `GET /api/products` - Listar productos
- `GET /api/products/:slug` - Detalle de producto

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Crear pedido

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

**Credenciales de prueba:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```



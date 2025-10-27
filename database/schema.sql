CREATE DATABASE IF NOT EXISTS catalog_db;
USE catalog_db;

-- Tabla producto_estado
CREATE TABLE producto_estado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL
);

-- Tabla producto_tipo
CREATE TABLE producto_tipo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(100) NOT NULL
);

-- Tabla producto_categoria
CREATE TABLE producto_categoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(100) NOT NULL
);

-- Tabla productos
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL,
  descripcion_corta VARCHAR(255) NOT NULL,
  descripcion_larga TEXT,
  qty INT DEFAULT 0,
  ubicacion_imagen VARCHAR(500),
  producto_tipo_id INT NOT NULL,
  producto_categoria_id INT NOT NULL,
  producto_estado_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_estado_id) REFERENCES producto_estado(id),
  FOREIGN KEY (producto_tipo_id) REFERENCES producto_tipo(id),
  FOREIGN KEY (producto_categoria_id) REFERENCES producto_categoria(id),
  INDEX idx_sku (sku),
  INDEX idx_estado (producto_estado_id),
  INDEX idx_categoria (producto_categoria_id),
  INDEX idx_created (created_at)
);

-- Tabla lista_precios
CREATE TABLE lista_precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  precio DECIMAL(10, 2) NOT NULL,
  fecha_desde TIMESTAMP NOT NULL,
  fecha_hasta TIMESTAMP NOT NULL,
  producto_id INT NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  INDEX idx_producto_fecha (producto_id, fecha_desde, fecha_hasta)
);

-- Tabla clientes
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  domicilio VARCHAR(255),
  cuit VARCHAR(20) NOT NULL UNIQUE,
  INDEX idx_cuit (cuit)
);

-- Tabla pedidos
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden INT NOT NULL UNIQUE,
  fecha_circulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  precio DECIMAL(10, 2) NOT NULL,
  clase_entrega VARCHAR(100),
  condicion_pago_aplicada VARCHAR(100),
  id_cliente VARCHAR(50),
  producto_id INT NOT NULL,
  cliente_id INT NOT NULL,
  cantidad_solicitada INT NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  INDEX idx_numero_orden (numero_orden),
  INDEX idx_fecha (fecha_circulacion),
  INDEX idx_cliente (cliente_id)
);

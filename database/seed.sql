-- Limpiar datos existentes
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE lista_precios;
TRUNCATE TABLE productos;
TRUNCATE TABLE clientes;
TRUNCATE TABLE producto_categoria;
TRUNCATE TABLE producto_tipo;
TRUNCATE TABLE producto_estado;
SET FOREIGN_KEY_CHECKS = 1;

-- Insertar estados de producto
INSERT INTO producto_estado (id, descripcion) VALUES
(1, 'Deshabilitado'),
(2, 'Habilitado'),
(3, 'Mostrar');

-- Insertar tipos de producto
INSERT INTO producto_tipo (codigo, descripcion) VALUES
('DIA', 'Diarios'),
('RVT', 'Revistas'),
('OPC', 'Opcionales');

-- Insertar categorías de producto
INSERT INTO producto_categoria (id, codigo, descripcion) VALUES
(1, 'LNA', 'Familia La Nación'),
(2, 'POP', 'Familia Popular'),
(3, 'HOL', 'Familia Hola'),
(4, 'JAR', 'Familia Jardín'),
(5, 'LIV', 'Familia Living'),
(6, 'LUG', 'Familia Lugares'),
(7, 'OHL', 'Familia Ohlalá'),
(8, 'RST', 'Familia Rolling Stone'),
(9, 'VER', 'Familia Vertice'),
(10, 'TAP', 'Familia Tapas'),
(11, 'SHT', 'One Shot'),
(12, 'PLA', 'Opcionales Ed. Planeta'),
(13, 'PRH', 'Pengüin Random House'),
(14, 'GEN', 'Generico');

-- Insertar clientes
INSERT INTO clientes (id, nombre, apellido, domicilio, cuit) VALUES
(1, 'Roberto', 'Sanchez', 'MANDISOVI 2989', '30619823873'),
(2, 'Florencia', 'Gomez', 'DOBLAS 1769/71', '27221512117'),
(3, 'Adriana', 'MERONI', 'SARMIENTO 547', '20205558692'),
(4, 'Mario', 'Aguirre', 'PARANA 26', '30205558692'),
(5, 'Otero', 'Maria', 'SANTA FE 16', '20201558691'),
(6, 'Juan', 'Lopez', 'SANTA FE 16', '30680478070');

-- Insertar productos
INSERT INTO productos (id, sku, descripcion_corta, descripcion_larga, qty, ubicacion_imagen, producto_tipo_id, producto_categoria_id, producto_estado_id, created_at) VALUES
(1, 'DLN01', 'LA NACION LUNES', 'Diario La Nación Lunes', NULL, NULL, 1, 1, 1, '2025-05-07 00:00:00'),
(2, 'HOL11020300373', 'HOLA', '¡HOLA! Argentina Ed.373', 6, 'https://dev-media-admin/media-folder/imagenes/HOL11020300373.jpg', 2, 3, 3, '2025-09-27 00:00:00'),
(3, 'JAR11021400001', 'AGENDA JARDIN', 'AGENDA JARDIN ED.1', 9, 'https://dev-media-admin/media-folder/imagenes/JAR11021400001.jpg', 2, 4, 3, '2025-05-07 00:00:00'),
(4, 'HOL11020300398', 'HOLA', '¡HOLA! Argentina Ed.398', 10, NULL, 1, 3, 3, '2025-05-17 00:00:00'),
(5, 'OPC13066300001', 'LIBROS PLANETA', 'EL CLUB DEL CRIMEN DE LOS JUEVES', 12, 'https://dev-media-admin/media-folder/imagenes/OPC13066300001.jpg', 3, 12, 3, '2025-06-09 00:00:00'),
(6, 'OPC11092810014', 'JARD EN CASA - RE', 'JARD EN CASA - RZ - ED. 10014', 5, 'https://dev-media-admin/media-folder/imagenes/OPC11092810014.jpg', 3, 14, 3, '2025-01-09 00:00:00'),
(7, 'HOL11020300406', 'HOLA', '¡HOLA! Argentina Ed.406', 9, 'https://dev-media-admin/media-folder/imagenes/HOL11020300406.jpg', 2, 3, 1, '2025-03-19 00:00:00'),
(8, 'POP01', 'POPULAR LUN', 'Diario El Popular Lunes', NULL, NULL, 1, 2, 1, '2025-03-19 00:00:00'),
(9, 'POP02', 'POPULAR MAR', 'Diario El Popular Martes', NULL, NULL, 1, 2, 1, '2025-05-15 00:00:00'),
(10, 'LUG00006500259', 'LUGARES', 'LUGARES', NULL, NULL, 3, 6, 3, '2025-03-19 00:00:00'),
(11, 'HOL11020300401', 'HOLA', '¡HOLA! Argentina Ed.401', NULL, NULL, 3, 3, 3, '2025-07-28 00:00:00');

-- Insertar lista de precios
INSERT INTO lista_precios (id, precio, fecha_desde, fecha_hasta, producto_id) VALUES
(1, 8.00, '2025-09-05 03:00:00', '2025-11-07 03:00:00', 2),
(2, 8.00, '2025-09-05 03:00:00', '2025-10-07 03:00:00', 3),
(3, 7.00, '2025-09-05 03:00:00', '2025-10-12 03:00:00', 5),
(4, 7.00, '2025-09-05 03:00:00', '2025-12-11 03:00:00', 10),
(5, 17.00, '2025-09-05 03:00:00', '2025-12-01 03:00:00', 4);

-- Insertar pedidos
INSERT INTO pedidos (id, numero_orden, fecha_circulacion, precio, clase_entrega, id_cliente, condicion_pago_aplicada, producto_id, cliente_id, cantidad_solicitada) VALUES
(1, 1001, '2025-01-03 00:00:00', 888.00, 'ASG', '106', 'FAC', 2, 1, 5),
(2, 1002, '2025-11-03 00:00:00', 78.00, 'ASG', '106', 'FAC', 3, 1, 15),
(3, 1003, '2025-11-13 00:00:00', 17.00, 'REP', '106', 'FAC', 4, 2, 74),
(4, 1004, '2025-12-01 00:00:00', 45.00, 'REP', '106', 'FAC', 5, 2, 45),
(5, 1005, '2025-10-01 00:00:00', 5.00, 'ASIG', '106', 'FAC', 5, 3, 45),
(6, 1006, '2025-10-11 00:00:00', 35.00, 'ASIG', '106', 'FAC', 10, 4, 8);

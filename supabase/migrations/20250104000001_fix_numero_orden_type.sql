-- Cambiar el tipo de columna numero_orden a TEXT para soportar el formato ORD-XXXXXXXX
ALTER TABLE ordenes_servicio ALTER COLUMN numero_orden TYPE text;

-- Agregar campo para imágenes por color en productos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS imagenes_por_color JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.imagenes_por_color IS 'Mapa de color a URL de imagen: {"Piel": "url1", "Negro": "url2"}';
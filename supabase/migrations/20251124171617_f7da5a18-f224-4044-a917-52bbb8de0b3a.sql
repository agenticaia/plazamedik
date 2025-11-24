-- Add leg zone category column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS zona_pierna TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.zona_pierna IS 'Zona de la pierna donde actúa la prenda: pies, pantorrilla, pierna_media, rodilla, muslo, panty';

-- Update existing products based on their type
-- Rodilla products
UPDATE products 
SET zona_pierna = 'rodilla'
WHERE nombre_producto ILIKE '%rodilla%' OR nombre_producto ILIKE '%750%' OR nombre_producto ILIKE '%870%';

-- Muslo products
UPDATE products 
SET zona_pierna = 'muslo'
WHERE nombre_producto ILIKE '%muslo%' OR nombre_producto ILIKE '%880%';

-- Panty products
UPDATE products 
SET zona_pierna = 'panty'
WHERE nombre_producto ILIKE '%panty%' OR nombre_producto ILIKE '%950%';

-- Set default for any remaining products
UPDATE products 
SET zona_pierna = 'rodilla'
WHERE zona_pierna IS NULL;
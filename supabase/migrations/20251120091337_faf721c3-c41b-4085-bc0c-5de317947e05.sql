-- Agregar campos adicionales a la tabla products para detalle completo

ALTER TABLE products
ADD COLUMN IF NOT EXISTS descripcion_corta TEXT,
ADD COLUMN IF NOT EXISTS precio_anterior NUMERIC,
ADD COLUMN IF NOT EXISTS tallas_disponibles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS colores_disponibles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ideal_para TEXT,
ADD COLUMN IF NOT EXISTS beneficios TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS especificaciones TEXT[] DEFAULT '{}';
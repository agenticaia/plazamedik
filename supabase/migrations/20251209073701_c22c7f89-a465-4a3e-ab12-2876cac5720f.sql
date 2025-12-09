-- Vista de inventario crítico para el Agente IA
-- Adaptada a la estructura real de la tabla products
CREATE OR REPLACE VIEW vista_inventario_critico AS
SELECT 
  p.product_code as sku,
  p.nombre_producto as nombre,
  p.cantidad_stock as stock_actual,
  p.ai_reorder_point as punto_reorden,
  COALESCE(s.name, v.name, 'Sin proveedor') as proveedor_preferido,
  p.cost as costo_ultimo,
  (COALESCE(p.ai_reorder_point, 20) - COALESCE(p.cantidad_stock, 0)) as cantidad_a_pedir
FROM products p
LEFT JOIN suppliers s ON s.id = p.preferred_supplier_id
LEFT JOIN vendors v ON v.id = p.vendor_id
WHERE COALESCE(p.cantidad_stock, 0) <= COALESCE(p.ai_reorder_point, 20)
  AND (p.is_discontinued = false OR p.is_discontinued IS NULL);

-- Permisos para que n8n pueda leer la vista
GRANT SELECT ON vista_inventario_critico TO anon, authenticated, service_role;
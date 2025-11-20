-- ============================================
-- FUNCIONES SQL PARA MÉTRICAS DE PRODUCTOS
-- ============================================

-- 1. Función para incrementar vistas de producto
CREATE OR REPLACE FUNCTION increment_product_views(p_product_code TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET 
    total_views = total_views + 1,
    updated_at = NOW()
  WHERE product_code = p_product_code;
  
  -- Si el producto no existe, insertarlo con vista inicial
  IF NOT FOUND THEN
    INSERT INTO products (product_code, total_views, created_at, updated_at)
    VALUES (p_product_code, 1, NOW(), NOW())
    ON CONFLICT (product_code) DO UPDATE
    SET total_views = products.total_views + 1;
  END IF;
END;
$$;

-- 2. Función para incrementar contador de recomendaciones
CREATE OR REPLACE FUNCTION increment_product_recommendations(p_product_code TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET 
    total_recommendations = total_recommendations + 1,
    updated_at = NOW()
  WHERE product_code = p_product_code;
END;
$$;

-- 3. Función para registrar venta y actualizar métricas
CREATE OR REPLACE FUNCTION register_product_sale(
  p_product_code TEXT,
  p_quantity INT DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_stock INT;
  v_new_sales INT;
BEGIN
  -- Actualizar stock y ventas
  UPDATE products
  SET 
    cantidad_stock = GREATEST(cantidad_stock - p_quantity, 0),
    total_vendido = total_vendido + p_quantity,
    updated_at = NOW()
  WHERE product_code = p_product_code
  RETURNING cantidad_stock, total_vendido INTO v_new_stock, v_new_sales;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'product_code', p_product_code,
    'new_stock', v_new_stock,
    'total_sales', v_new_sales,
    'stock_status', CASE
      WHEN v_new_stock = 0 THEN 'agotado'
      WHEN v_new_stock <= 10 THEN 'bajo'
      ELSE 'disponible'
    END
  );
END;
$$;

-- 4. Función para actualizar stock manualmente
CREATE OR REPLACE FUNCTION update_product_stock(
  p_product_code TEXT,
  p_new_stock INT
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_stock INT;
BEGIN
  -- Obtener stock anterior
  SELECT cantidad_stock INTO v_old_stock
  FROM products
  WHERE product_code = p_product_code;
  
  -- Actualizar stock
  UPDATE products
  SET 
    cantidad_stock = p_new_stock,
    updated_at = NOW()
  WHERE product_code = p_product_code;
  
  RETURN json_build_object(
    'success', true,
    'product_code', p_product_code,
    'old_stock', v_old_stock,
    'new_stock', p_new_stock,
    'difference', p_new_stock - v_old_stock
  );
END;
$$;

-- 5. Función para obtener productos con stock bajo
CREATE OR REPLACE FUNCTION get_low_stock_products(p_threshold INT DEFAULT 10)
RETURNS TABLE (
  product_code TEXT,
  nombre_producto TEXT,
  cantidad_stock INT,
  total_vendido INT,
  demanda_diaria NUMERIC,
  dias_restantes INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.product_code,
    p.nombre_producto,
    p.cantidad_stock,
    p.total_vendido,
    ROUND(CAST(p.total_vendido AS NUMERIC) / 30, 2) as demanda_diaria,
    CASE 
      WHEN p.total_vendido > 0 THEN 
        FLOOR(p.cantidad_stock / (CAST(p.total_vendido AS NUMERIC) / 30))
      ELSE 
        999
    END as dias_restantes
  FROM products p
  WHERE p.cantidad_stock <= p_threshold
  ORDER BY p.cantidad_stock ASC;
END;
$$;

-- 6. Función para calcular métricas de conversión por producto
CREATE OR REPLACE FUNCTION get_product_conversion_metrics(p_product_code TEXT)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'product_code', p.product_code,
    'total_views', p.total_views,
    'total_vendido', p.total_vendido,
    'total_recommendations', p.total_recommendations,
    'conversion_rate', CASE 
      WHEN p.total_views > 0 THEN 
        ROUND((CAST(p.total_vendido AS NUMERIC) / p.total_views * 100), 2)
      ELSE 0 
    END,
    'recommendation_conversion', CASE
      WHEN p.total_recommendations > 0 THEN
        ROUND((CAST(p.total_vendido AS NUMERIC) / p.total_recommendations * 100), 2)
      ELSE 0
    END,
    'ingresos_generados', p.precio * p.total_vendido
  ) INTO v_result
  FROM products p
  WHERE p.product_code = p_product_code;
  
  RETURN v_result;
END;
$$;

-- 7. Función para obtener dashboard de métricas generales
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_productos', COUNT(*),
    'total_stock', SUM(cantidad_stock),
    'total_vendido', SUM(total_vendido),
    'total_ingresos', SUM(precio * total_vendido),
    'total_views', SUM(total_views),
    'productos_bajo_stock', COUNT(*) FILTER (WHERE cantidad_stock <= 10),
    'productos_agotados', COUNT(*) FILTER (WHERE cantidad_stock = 0),
    'conversion_rate_promedio', ROUND(
      AVG(CASE 
        WHEN total_views > 0 THEN 
          (CAST(total_vendido AS NUMERIC) / total_views * 100)
        ELSE 0 
      END), 2
    ),
    'updated_at', NOW()
  ) INTO v_result
  FROM products;
  
  RETURN v_result;
END;
$$;

-- 8. Función para predecir fecha de reabastecimiento
CREATE OR REPLACE FUNCTION predict_restock_date(p_product_code TEXT)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_result json;
  v_demanda_diaria NUMERIC;
  v_dias_restantes INT;
  v_fecha_reabastecimiento DATE;
BEGIN
  SELECT 
    CASE 
      WHEN total_vendido > 0 THEN 
        CAST(total_vendido AS NUMERIC) / 30
      ELSE 1 
    END,
    CASE 
      WHEN total_vendido > 0 THEN 
        FLOOR(cantidad_stock / (CAST(total_vendido AS NUMERIC) / 30))
      ELSE 999
    END,
    CASE 
      WHEN total_vendido > 0 AND cantidad_stock > 0 THEN 
        CURRENT_DATE + (FLOOR(cantidad_stock / (CAST(total_vendido AS NUMERIC) / 30)))::INT
      ELSE NULL
    END
  INTO v_demanda_diaria, v_dias_restantes, v_fecha_reabastecimiento
  FROM products
  WHERE product_code = p_product_code;
  
  SELECT json_build_object(
    'product_code', p_product_code,
    'demanda_diaria', ROUND(v_demanda_diaria, 2),
    'dias_restantes', v_dias_restantes,
    'fecha_reabastecimiento', v_fecha_reabastecimiento,
    'recomendacion', CASE
      WHEN v_dias_restantes <= 7 THEN 'Ordenar urgente'
      WHEN v_dias_restantes <= 14 THEN 'Planificar pedido pronto'
      ELSE 'Stock suficiente'
    END
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- TRIGGERS AUTOMÁTICOS
-- ============================================

-- Trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para sincronizar ventas con orders
CREATE OR REPLACE FUNCTION sync_product_sales_from_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se inserta una nueva orden con estado 'entregado' o 'enviado'
  IF NEW.status IN ('entregado', 'enviado') THEN
    -- Actualizar total_vendido del producto
    UPDATE products
    SET 
      total_vendido = total_vendido + 1,
      cantidad_stock = GREATEST(cantidad_stock - 1, 0),
      updated_at = NOW()
    WHERE product_code = NEW.product_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_sales_on_order_insert ON orders;
CREATE TRIGGER sync_sales_on_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_sales_from_orders();
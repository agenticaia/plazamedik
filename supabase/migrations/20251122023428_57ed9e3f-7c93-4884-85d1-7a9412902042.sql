-- Función para calcular el Punto de Reorden (ROP) automáticamente usando IA/Estadística
-- Basada en la fórmula: ROP = (Demanda durante Lead Time) + (Stock de Seguridad)

CREATE OR REPLACE FUNCTION calculate_reorder_points()
RETURNS TABLE(
  product_code TEXT,
  calculated_rop INTEGER,
  avg_daily_sales NUMERIC,
  max_daily_sales INTEGER,
  safety_stock NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_ads NUMERIC; -- Average Daily Sales
  v_mds INTEGER; -- Max Daily Sales in a single day
  v_lead_time INTEGER;
  v_max_lead_time NUMERIC;
  v_safety_stock NUMERIC;
  v_rop INTEGER;
  v_date_90_days_ago DATE;
BEGIN
  -- Fecha de hace 90 días
  v_date_90_days_ago := CURRENT_DATE - INTERVAL '90 days';
  
  -- Iterar sobre cada producto activo
  FOR v_product IN 
    SELECT 
      p.id,
      p.product_code,
      p.vendor_id,
      v.lead_time_days
    FROM products p
    LEFT JOIN vendors v ON v.id = p.vendor_id
    WHERE p.is_discontinued = FALSE OR p.is_discontinued IS NULL
  LOOP
    
    -- Paso 1: Calcular Average Daily Sales (ADS) - últimos 90 días
    SELECT 
      COALESCE(SUM(soi.quantity), 0)::NUMERIC / 90 
    INTO v_ads
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE soi.product_code = v_product.product_code
      AND so.created_at >= v_date_90_days_ago;
    
    -- Paso 2: Calcular Max Daily Sales (MDS) - mayor venta en un día
    SELECT 
      COALESCE(MAX(daily_sales.total), 0)
    INTO v_mds
    FROM (
      SELECT 
        DATE(so.created_at) as sale_date,
        SUM(soi.quantity) as total
      FROM sales_order_items soi
      JOIN sales_orders so ON so.id = soi.sales_order_id
      WHERE soi.product_code = v_product.product_code
        AND so.created_at >= v_date_90_days_ago
      GROUP BY DATE(so.created_at)
    ) daily_sales;
    
    -- Paso 3: Obtener Lead Time del vendor (default 7 días si no hay vendor)
    v_lead_time := COALESCE(v_product.lead_time_days, 7);
    v_max_lead_time := v_lead_time * 1.3; -- 30% buffer por variabilidad
    
    -- Paso 4: Calcular Safety Stock
    -- Formula: (MDS * max_lead_time) - (ADS * lead_time)
    v_safety_stock := (v_mds * v_max_lead_time) - (v_ads * v_lead_time);
    
    -- Asegurar que el safety stock no sea negativo
    IF v_safety_stock < 0 THEN
      v_safety_stock := 0;
    END IF;
    
    -- Paso 5: Calcular ROP = (ADS * lead_time) + Safety_Stock
    v_rop := CEILING((v_ads * v_lead_time) + v_safety_stock);
    
    -- Si no hay historial de ventas, usar default de 10
    IF v_ads = 0 AND v_mds = 0 THEN
      v_rop := 10;
      
      -- Actualizar el producto con ROP default
      UPDATE products
      SET 
        ai_reorder_point = v_rop,
        updated_at = NOW()
      WHERE product_code = v_product.product_code;
      
      -- Retornar resultado
      RETURN QUERY SELECT 
        v_product.product_code,
        v_rop,
        v_ads,
        v_mds,
        v_safety_stock,
        'Sin historial - ROP default'::TEXT;
      
    ELSE
      -- Actualizar el producto con ROP calculado
      UPDATE products
      SET 
        ai_reorder_point = v_rop,
        updated_at = NOW()
      WHERE product_code = v_product.product_code;
      
      -- Retornar resultado
      RETURN QUERY SELECT 
        v_product.product_code,
        v_rop,
        v_ads,
        v_mds,
        v_safety_stock,
        FORMAT('ROP calculado: ADS=%.2f, MDS=%s, LT=%s días', v_ads, v_mds, v_lead_time)::TEXT;
    END IF;
    
  END LOOP;
  
  RETURN;
  
EXCEPTION
  WHEN division_by_zero THEN
    RAISE NOTICE 'Error de división por cero detectado';
    RETURN;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inesperado: %', SQLERRM;
    RETURN;
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION calculate_reorder_points() IS 
'Calcula el Punto de Reorden (ROP) para cada producto usando estadística de ventas:
1. ADS (Average Daily Sales) = Total vendido últimos 90 días / 90
2. MDS (Max Daily Sales) = Mayor venta en un solo día
3. Lead Time con 30% buffer para variabilidad
4. Safety Stock = (MDS * max_lead_time) - (ADS * lead_time)
5. ROP = (ADS * lead_time) + Safety Stock

Actualiza automáticamente el campo ai_reorder_point en products.
Productos sin historial reciben ROP default de 10 unidades.';

-- Crear un wrapper para ejecutar y ver resultados
CREATE OR REPLACE FUNCTION run_reorder_calculation()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_total_updated INTEGER;
BEGIN
  -- Ejecutar el cálculo
  PERFORM calculate_reorder_points();
  
  -- Contar productos actualizados
  SELECT COUNT(*) INTO v_total_updated
  FROM products
  WHERE ai_reorder_point IS NOT NULL
    AND (is_discontinued = FALSE OR is_discontinued IS NULL);
  
  -- Retornar resumen
  v_result := json_build_object(
    'success', TRUE,
    'products_updated', v_total_updated,
    'calculated_at', NOW(),
    'message', 'Reorder points calculados exitosamente'
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION run_reorder_calculation() IS 
'Ejecuta calculate_reorder_points() y retorna un resumen JSON.
Útil para llamar desde edge functions o manualmente para ver resultados.';
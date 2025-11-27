-- ============================================
-- MIGRACIÓN: ALINEACIÓN GRADUAL DE ESTADOS
-- Fase 1: Normalizar estados existentes
-- ============================================

-- 1. ELIMINAR CONSTRAINTS EXISTENTES TEMPORALMENTE
-- ============================================

ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_fulfillment_status_check;
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

-- 2. MAPEAR ESTADOS EXISTENTES A NUEVOS ESTADOS DEL SOP
-- ============================================

-- Sales Orders: FULFILLED -> DELIVERED (estado final entregado)
UPDATE sales_orders 
SET fulfillment_status = 'DELIVERED'
WHERE fulfillment_status = 'FULFILLED';

-- Purchase Orders: PARTIAL_RECEIPT -> PARTIAL_RECEIVED
UPDATE purchase_orders
SET status = 'PARTIAL_RECEIVED'
WHERE status = 'PARTIAL_RECEIPT';

-- 3. AÑADIR CONSTRAINTS PARA VALIDAR NUEVOS ESTADOS
-- ============================================

-- Sales Orders: Estados permitidos según SOP
ALTER TABLE sales_orders
ADD CONSTRAINT sales_orders_fulfillment_status_check
CHECK (fulfillment_status IN (
  'UNFULFILLED',      -- Pedido recibido, pendiente
  'WAITING_STOCK',    -- Esperando reabastecimiento
  'PICKING',          -- En recolección
  'PACKED',           -- Empacado
  'SHIPPED',          -- En tránsito
  'DELIVERED',        -- Entregado
  'PARTIAL',          -- Parcial
  'CANCELLED'         -- Cancelado
));

-- Purchase Orders: Estados permitidos según SOP
ALTER TABLE purchase_orders
ADD CONSTRAINT purchase_orders_status_check
CHECK (status IN (
  'DRAFT',              -- Borrador
  'APPROVED',           -- Aprobada
  'SENT',               -- Enviada
  'CONFIRMED',          -- Confirmada
  'IN_TRANSIT',         -- En camino
  'PARTIAL_RECEIVED',   -- Recepción parcial
  'RECEIVED',           -- Recibida
  'CLOSED',             -- Cerrada
  'CANCELLED'           -- Cancelada
));

-- 4. ACTUALIZAR DEFAULTS SEGÚN SOP
-- ============================================

ALTER TABLE sales_orders 
  ALTER COLUMN fulfillment_status SET DEFAULT 'UNFULFILLED';

ALTER TABLE purchase_orders 
  ALTER COLUMN status SET DEFAULT 'DRAFT';

-- 5. MEJORAR FUNCIÓN DE AUTO-CREACIÓN DE PO EN BACKORDER
-- ============================================

CREATE OR REPLACE FUNCTION auto_check_stock_and_create_backorder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_supplier_id UUID;
  v_po_number TEXT;
  v_new_po_id UUID;
  v_sales_order RECORD;
BEGIN
  SELECT 
    p.*,
    p.preferred_supplier_id,
    p.cantidad_stock,
    p.cost,
    p.precio
  INTO v_product
  FROM products p
  WHERE p.product_code = NEW.product_code;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Verificar stock disponible
  IF (v_product.cantidad_stock IS NULL OR v_product.cantidad_stock < NEW.quantity) THEN
    
    NEW.is_backorder := TRUE;
    
    SELECT * INTO v_sales_order
    FROM sales_orders
    WHERE id = NEW.sales_order_id;
    
    IF v_product.preferred_supplier_id IS NOT NULL THEN
      v_supplier_id := v_product.preferred_supplier_id;
    ELSE
      SELECT id INTO v_supplier_id
      FROM suppliers
      WHERE is_active = TRUE
      LIMIT 1;
    END IF;
    
    IF v_supplier_id IS NULL THEN
      RAISE NOTICE 'No hay proveedor disponible para producto %', NEW.product_code;
      RETURN NEW;
    END IF;
    
    v_po_number := generate_po_number_sequential();
    
    -- Crear PO automática en estado DRAFT (según SOP)
    INSERT INTO purchase_orders (
      order_number,
      supplier_id,
      product_code,
      product_name,
      quantity,
      unit_price,
      total_amount,
      status,
      order_type,
      po_type,
      priority,
      linked_sales_order_id,
      notes
    ) VALUES (
      v_po_number,
      v_supplier_id,
      NEW.product_code,
      NEW.product_name,
      NEW.quantity,
      COALESCE(v_product.cost, v_product.precio * 0.6),
      NEW.quantity * COALESCE(v_product.cost, v_product.precio * 0.6),
      'DRAFT',
      'automatica',
      'BACKORDER_FULFILLMENT',
      'HIGH',
      NEW.sales_order_id,
      FORMAT(E'🤖 PO AUTOMÁTICA - BACKORDER FULFILLMENT\n\n📋 CONTEXTO:\n• Orden de venta: %s\n• Cliente: %s\n• Stock actual: %s unidades\n• Requerido: %s unidades\n\n⚡ ACCIÓN REQUERIDA:\n1. REVISAR y APROBAR esta PO\n2. ENVIAR al proveedor\n3. Al recibir, activar CROSS-DOCKING directo al cliente',
        v_sales_order.order_number,
        v_sales_order.customer_name,
        COALESCE(v_product.cantidad_stock, 0),
        NEW.quantity
      )
    )
    RETURNING id INTO v_new_po_id;
    
    NEW.linked_purchase_order_id := v_new_po_id;
    
    -- Actualizar Sales Order a WAITING_STOCK
    UPDATE sales_orders
    SET fulfillment_status = 'WAITING_STOCK'
    WHERE id = NEW.sales_order_id;
    
    INSERT INTO order_state_log (
      sales_order_id,
      from_state,
      to_state,
      notes,
      automated
    ) VALUES (
      NEW.sales_order_id,
      'UNFULFILLED',
      'WAITING_STOCK',
      FORMAT('Backorder detectado. PO %s creada en DRAFT. Requiere aprobación.', v_po_number),
      TRUE
    );
    
    RAISE NOTICE 'Backorder: PO % creada (DRAFT). Requiere aprobación antes de enviar.', v_po_number;
    
  ELSE
    -- Stock disponible: Listo para PICKING
    UPDATE sales_orders
    SET 
      fulfillment_status = 'UNFULFILLED',
      notes = COALESCE(notes || E'\n', '') || 
              FORMAT('✅ Stock reservado: %s unidades de %s', NEW.quantity, NEW.product_code)
    WHERE id = NEW.sales_order_id;
    
    INSERT INTO order_state_log (
      sales_order_id,
      from_state,
      to_state,
      notes,
      automated
    ) VALUES (
      NEW.sales_order_id,
      NULL,
      'UNFULFILLED',
      FORMAT('Stock disponible: %s unidades de %s. Listo para picking.', NEW.quantity, NEW.product_code),
      TRUE
    );
    
    RAISE NOTICE 'Stock reservado: % unidades de % para SO %', 
      NEW.quantity, NEW.product_code, NEW.sales_order_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. CREAR FUNCIÓN MEJORADA DE RECEPCIÓN DE PO
-- ============================================

CREATE OR REPLACE FUNCTION process_po_reception(
  p_po_id UUID,
  p_qty_received INTEGER DEFAULT NULL,
  p_is_complete BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po RECORD;
  v_linked_so RECORD;
BEGIN
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = p_po_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'PO no encontrada');
  END IF;
  
  -- Si tiene SO vinculada = CROSS-DOCKING
  IF v_po.linked_sales_order_id IS NOT NULL THEN
    
    SELECT * INTO v_linked_so
    FROM sales_orders
    WHERE id = v_po.linked_sales_order_id;
    
    -- Actualizar estado de PO
    UPDATE purchase_orders
    SET 
      status = CASE 
        WHEN p_is_complete THEN 'RECEIVED'
        ELSE 'PARTIAL_RECEIVED'
      END,
      actual_delivery_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = p_po_id;
    
    -- Si recepción completa, activar cross-docking
    IF p_is_complete THEN
      -- Mover SO a PICKING para procesamiento directo
      UPDATE sales_orders
      SET 
        fulfillment_status = 'PICKING',
        picking_started_at = NOW(),
        notes = COALESCE(notes || E'\n', '') || 
                FORMAT('🚚 CROSS-DOCKING: PO %s recibida. Envío directo sin almacenar.', v_po.order_number)
      WHERE id = v_po.linked_sales_order_id;
      
      INSERT INTO order_state_log (
        sales_order_id,
        from_state,
        to_state,
        notes,
        automated
      ) VALUES (
        v_po.linked_sales_order_id,
        'WAITING_STOCK',
        'PICKING',
        FORMAT('Cross-docking activado. PO %s recibida. Procesamiento directo sin almacenamiento.', v_po.order_number),
        TRUE
      );
    END IF;
    
    -- Actualizar stock mínimo
    UPDATE products
    SET 
      cantidad_stock = cantidad_stock + COALESCE(p_qty_received, v_po.quantity),
      updated_at = NOW()
    WHERE product_code = v_po.product_code;
    
  ELSE
    -- Recepción normal sin cross-docking
    UPDATE products
    SET 
      cantidad_stock = cantidad_stock + COALESCE(p_qty_received, v_po.quantity),
      updated_at = NOW()
    WHERE product_code = v_po.product_code;
    
    UPDATE purchase_orders
    SET 
      status = CASE 
        WHEN p_is_complete THEN 'RECEIVED'
        ELSE 'PARTIAL_RECEIVED'
      END,
      actual_delivery_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = p_po_id;
  END IF;
  
  RETURN json_build_object(
    'success', TRUE,
    'po_number', v_po.order_number,
    'status', CASE WHEN p_is_complete THEN 'RECEIVED' ELSE 'PARTIAL_RECEIVED' END,
    'cross_docking', v_po.linked_sales_order_id IS NOT NULL,
    'linked_so', v_linked_so.order_number
  );
END;
$$;

-- 7. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_orders_fulfillment_status 
  ON sales_orders(fulfillment_status) 
  WHERE fulfillment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status 
  ON purchase_orders(status) 
  WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_po_linked_sales_order 
  ON purchase_orders(linked_sales_order_id) 
  WHERE linked_sales_order_id IS NOT NULL;

-- 8. DOCUMENTACIÓN
-- ============================================

COMMENT ON COLUMN sales_orders.fulfillment_status IS 
'Estados según SOP: UNFULFILLED→WAITING_STOCK→PICKING→PACKED→SHIPPED→DELIVERED. PARTIAL si entrega parcial, CANCELLED si cancelado';

COMMENT ON COLUMN purchase_orders.status IS 
'Estados según SOP: DRAFT→APPROVED→SENT→CONFIRMED→IN_TRANSIT→RECEIVED. PARTIAL_RECEIVED si parcial, CLOSED al finalizar';

COMMENT ON COLUMN purchase_orders.linked_sales_order_id IS 
'Si existe, indica operación de cross-docking. La mercancía debe enviarse directamente sin almacenar';

COMMENT ON FUNCTION process_po_reception IS 
'Procesa recepción de PO. Si linked_sales_order_id existe, activa flujo automático de cross-docking moviendo SO a PICKING';

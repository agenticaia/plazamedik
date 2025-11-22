-- Trigger automático para detectar falta de stock y crear PO de backorder

-- Paso 1: Crear función que verifica stock y crea PO automática
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
  -- Obtener información del producto
  SELECT 
    p.*,
    p.preferred_supplier_id,
    p.cantidad_stock,
    p.cost,
    p.precio
  INTO v_product
  FROM products p
  WHERE p.product_code = NEW.product_code;

  -- Si no existe el producto, continuar sin hacer nada
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Verificar si hay suficiente stock
  IF (v_product.cantidad_stock IS NULL OR v_product.cantidad_stock < NEW.quantity) THEN
    
    -- Marcar el item como backorder
    NEW.is_backorder := TRUE;
    
    -- Obtener información de la orden de venta
    SELECT * INTO v_sales_order
    FROM sales_orders
    WHERE id = NEW.sales_order_id;
    
    -- Determinar el proveedor a usar
    IF v_product.preferred_supplier_id IS NOT NULL THEN
      v_supplier_id := v_product.preferred_supplier_id;
    ELSE
      -- Obtener el primer proveedor activo
      SELECT id INTO v_supplier_id
      FROM suppliers
      WHERE is_active = TRUE
      LIMIT 1;
    END IF;
    
    -- Si no hay proveedor disponible, solo marcar como backorder
    IF v_supplier_id IS NULL THEN
      RAISE NOTICE 'No hay proveedor disponible para producto %', NEW.product_code;
      RETURN NEW;
    END IF;
    
    -- Generar número de PO
    v_po_number := generate_po_number_sequential();
    
    -- Crear la Purchase Order automáticamente
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
      'PO AUTOMÁTICA: Generada por falta de stock. CROSS-DOCKING - Enviar directo al cliente ' || v_sales_order.customer_name || ' sin almacenar.'
    )
    RETURNING id INTO v_new_po_id;
    
    -- Vincular la PO con el item de venta
    NEW.linked_purchase_order_id := v_new_po_id;
    
    -- Actualizar el estado de cumplimiento de la orden de venta
    UPDATE sales_orders
    SET fulfillment_status = 'WAITING_STOCK'
    WHERE id = NEW.sales_order_id;
    
    -- Registrar en el log de estados
    INSERT INTO order_state_log (
      sales_order_id,
      from_state,
      to_state,
      notes,
      automated
    ) VALUES (
      NEW.sales_order_id,
      'NEW',
      'BACKORDER_PO_CREATED',
      'PO automática ' || v_po_number || ' creada por falta de stock de ' || NEW.product_code || '. Cross-docking activado.',
      TRUE
    );
    
    RAISE NOTICE 'Backorder detectado: PO % creada para % unidades de %', 
      v_po_number, NEW.quantity, NEW.product_code;
    
  ELSE
    -- HAY STOCK SUFICIENTE: Reservar automáticamente
    UPDATE products
    SET cantidad_stock = cantidad_stock - NEW.quantity
    WHERE product_code = NEW.product_code;
    
    -- Marcar la orden como lista para picking
    UPDATE sales_orders
    SET 
      fulfillment_status = 'UNFULFILLED',
      picking_started_at = NOW()
    WHERE id = NEW.sales_order_id;
    
    -- Registrar reserva de stock en el log
    INSERT INTO order_state_log (
      sales_order_id,
      from_state,
      to_state,
      notes,
      automated
    ) VALUES (
      NEW.sales_order_id,
      'NEW',
      'STOCK_RESERVED',
      'Stock reservado: ' || NEW.quantity || ' unidades de ' || NEW.product_code || '. Lista para picking.',
      TRUE
    );
    
    RAISE NOTICE 'Stock reservado: % unidades de % para orden %', 
      NEW.quantity, NEW.product_code, NEW.sales_order_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Paso 2: Crear el trigger que se ejecuta al insertar sales_order_items
DROP TRIGGER IF EXISTS trigger_auto_backorder_on_insert ON sales_order_items;

CREATE TRIGGER trigger_auto_backorder_on_insert
  BEFORE INSERT ON sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_check_stock_and_create_backorder();

-- Paso 3: Comentarios para documentación
COMMENT ON FUNCTION auto_check_stock_and_create_backorder() IS 
'Trigger function que automáticamente:
1. Verifica stock del producto cuando se inserta un sales_order_item
2. Si NO hay stock: marca backorder, crea PO automática, vincula con linked_purchase_order_id
3. Si SÍ hay stock: reserva el stock, marca orden para picking
4. Registra todos los eventos en order_state_log';

COMMENT ON TRIGGER trigger_auto_backorder_on_insert ON sales_order_items IS
'Trigger automático que ejecuta validación de stock y creación de PO de backorder/cross-docking al insertar items de venta';
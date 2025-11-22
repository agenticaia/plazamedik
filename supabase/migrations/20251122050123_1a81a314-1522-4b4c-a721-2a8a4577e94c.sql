-- ============================================
-- MEJORAS AL SISTEMA DE PURCHASE ORDERS
-- ============================================

-- 1. Agregar columnas de pago y tracking adicionales
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL_PAID', 'PAID', 'OVERDUE')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_reference_number TEXT,
ADD COLUMN IF NOT EXISTS vendor_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS warehouse_destination TEXT DEFAULT 'ALMACEN_PRINCIPAL',
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PEN' CHECK (currency IN ('PEN', 'USD', 'EUR'));

-- 2. Agregar índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_po_payment_status ON purchase_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_po_vendor_reference ON purchase_orders(vendor_reference_number);
CREATE INDEX IF NOT EXISTS idx_po_warehouse ON purchase_orders(warehouse_destination);
CREATE INDEX IF NOT EXISTS idx_po_created_at ON purchase_orders(created_at);

-- 3. Función para calcular total de PO desde items
CREATE OR REPLACE FUNCTION calculate_po_total(po_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(qty_ordered * cost_per_unit), 0)
  INTO total
  FROM purchase_order_items
  WHERE purchase_order_id = po_id;
  
  RETURN total;
END;
$$;

-- 4. Función para obtener resumen de items de una PO
CREATE OR REPLACE FUNCTION get_po_items_summary(po_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_items', COUNT(*),
    'total_skus', COUNT(DISTINCT product_code),
    'total_units_ordered', SUM(qty_ordered),
    'total_units_received', SUM(qty_received),
    'completion_percentage', CASE 
      WHEN SUM(qty_ordered) > 0 THEN 
        ROUND((SUM(qty_received)::NUMERIC / SUM(qty_ordered)::NUMERIC) * 100, 2)
      ELSE 0
    END,
    'preview_items', json_agg(
      json_build_object(
        'product_name', product_name,
        'product_code', product_code,
        'qty_ordered', qty_ordered
      )
    )
  )
  INTO result
  FROM purchase_order_items
  WHERE purchase_order_id = po_id;
  
  RETURN result;
END;
$$;

-- 5. Trigger para actualizar total_cost cuando se modifican items
CREATE OR REPLACE FUNCTION update_po_total_on_items_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the purchase order total_cost
  UPDATE purchase_orders
  SET 
    total_cost = calculate_po_total(
      COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_po_total ON purchase_order_items;
CREATE TRIGGER trigger_update_po_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_po_total_on_items_change();

-- 6. Función para duplicar una Purchase Order
CREATE OR REPLACE FUNCTION duplicate_purchase_order(
  source_po_id UUID,
  new_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_po_id UUID;
  new_po_number TEXT;
  source_po RECORD;
  item RECORD;
BEGIN
  -- Get source PO data
  SELECT * INTO source_po
  FROM purchase_orders
  WHERE id = source_po_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order not found';
  END IF;
  
  -- Generate new PO number
  new_po_number := generate_po_number_sequential();
  
  -- Create new PO
  INSERT INTO purchase_orders (
    order_number,
    supplier_id,
    vendor_id,
    status,
    order_type,
    po_type,
    priority,
    payment_status,
    payment_method,
    payment_terms,
    vendor_reference_number,
    warehouse_destination,
    currency,
    notes,
    expected_delivery_date,
    product_code,
    product_name,
    quantity,
    unit_price,
    total_amount
  )
  VALUES (
    new_po_number,
    source_po.supplier_id,
    source_po.vendor_id,
    'DRAFT',
    'manual',
    source_po.po_type,
    source_po.priority,
    'PENDING',
    source_po.payment_method,
    source_po.payment_terms,
    NULL, -- Clear vendor reference
    source_po.warehouse_destination,
    source_po.currency,
    COALESCE(new_notes, 'Duplicada de ' || source_po.order_number || ' - ' || source_po.notes),
    CURRENT_DATE + INTERVAL '7 days', -- Default to 7 days from now
    source_po.product_code,
    source_po.product_name,
    source_po.quantity,
    source_po.unit_price,
    source_po.total_amount
  )
  RETURNING id INTO new_po_id;
  
  -- Duplicate all items
  FOR item IN 
    SELECT * FROM purchase_order_items 
    WHERE purchase_order_id = source_po_id
  LOOP
    INSERT INTO purchase_order_items (
      purchase_order_id,
      product_code,
      product_name,
      qty_ordered,
      cost_per_unit,
      qty_received
    )
    VALUES (
      new_po_id,
      item.product_code,
      item.product_name,
      item.qty_ordered,
      item.cost_per_unit,
      0 -- Reset received quantity
    );
  END LOOP;
  
  RETURN new_po_id;
END;
$$;

-- 7. Vista para dashboard de pagos
CREATE OR REPLACE VIEW v_purchase_orders_payment_summary AS
SELECT 
  po.id,
  po.order_number,
  po.supplier_id,
  s.name as supplier_name,
  po.status,
  po.payment_status,
  po.total_cost,
  po.advance_payment_amount,
  (po.total_cost - po.advance_payment_amount) as balance_due,
  po.payment_terms,
  po.created_at,
  po.expected_delivery_date,
  po.actual_delivery_date,
  CASE 
    WHEN po.payment_status = 'OVERDUE' THEN 
      DATE_PART('day', NOW() - po.expected_delivery_date)
    ELSE 0
  END as days_overdue
FROM purchase_orders po
LEFT JOIN suppliers s ON s.id = po.supplier_id
WHERE po.status NOT IN ('CANCELLED', 'CLOSED')
ORDER BY po.created_at DESC;

COMMENT ON VIEW v_purchase_orders_payment_summary IS 'Vista resumen de pagos de purchase orders para dashboard financiero';
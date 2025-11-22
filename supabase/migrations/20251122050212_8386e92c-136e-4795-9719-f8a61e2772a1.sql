-- Fix security linter issues from previous migration

-- 1. Fix calculate_po_total function - add search_path
CREATE OR REPLACE FUNCTION calculate_po_total(po_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public
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

-- 2. Fix get_po_items_summary function - add search_path
CREATE OR REPLACE FUNCTION get_po_items_summary(po_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SET search_path = public
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

-- 3. Fix update_po_total_on_items_change function - add search_path
CREATE OR REPLACE FUNCTION update_po_total_on_items_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

-- 4. Fix duplicate_purchase_order function - add search_path
CREATE OR REPLACE FUNCTION duplicate_purchase_order(
  source_po_id UUID,
  new_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    NULL,
    source_po.warehouse_destination,
    source_po.currency,
    COALESCE(new_notes, 'Duplicada de ' || source_po.order_number || ' - ' || source_po.notes),
    CURRENT_DATE + INTERVAL '7 days',
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
      0
    );
  END LOOP;
  
  RETURN new_po_id;
END;
$$;
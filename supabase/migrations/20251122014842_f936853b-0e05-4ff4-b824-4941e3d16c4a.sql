-- ============================================
-- MIGRATION: Sequential Order Numbers & Workflow Automation
-- Purpose: Transform to real ERP with friendly IDs and O2C-P2P integration
-- ============================================

-- 1. Create sequences for friendly order numbers
CREATE SEQUENCE IF NOT EXISTS sales_order_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START WITH 5001;

-- 2. Create function for sequential sales order numbers (ORD-2025-1001)
CREATE OR REPLACE FUNCTION generate_sales_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num INT;
  year_str TEXT;
BEGIN
  seq_num := nextval('sales_order_seq');
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  RETURN 'ORD-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$;

-- 3. Create function for sequential purchase order numbers (PO-2025-5001)
CREATE OR REPLACE FUNCTION generate_po_number_sequential()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num INT;
  year_str TEXT;
BEGIN
  seq_num := nextval('purchase_order_seq');
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  RETURN 'PO-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$;

-- 4. Add workflow tracking fields to sales_orders
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS picking_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS courier TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'REGULAR' CHECK (customer_type IN ('NEW', 'REGULAR', 'VIP')),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Create order_state_log table for complete audit trail
CREATE TABLE IF NOT EXISTS order_state_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  automated BOOLEAN DEFAULT FALSE
);

-- 6. Create trigger function to log state changes
CREATE OR REPLACE FUNCTION log_order_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status) THEN
    INSERT INTO order_state_log (sales_order_id, from_state, to_state, changed_by, automated)
    VALUES (NEW.id, OLD.fulfillment_status, NEW.fulfillment_status, auth.uid(), FALSE);
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Attach trigger to sales_orders
DROP TRIGGER IF EXISTS trg_log_order_state ON sales_orders;
CREATE TRIGGER trg_log_order_state
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_state_change();

-- 8. Create function to auto-generate PO when backorder detected
CREATE OR REPLACE FUNCTION auto_create_po_for_backorder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_supplier_id UUID;
  v_po_number TEXT;
  v_new_po_id UUID;
BEGIN
  -- Only trigger if item is marked as backorder and not already linked to PO
  IF NEW.is_backorder = TRUE AND NEW.linked_purchase_order_id IS NULL THEN
    
    -- Get product details and preferred supplier
    SELECT p.*, p.preferred_supplier_id, p.precio, p.cost
    INTO v_product
    FROM products p
    WHERE p.product_code = NEW.product_code;
    
    -- If no preferred supplier, get the first active supplier
    IF v_product.preferred_supplier_id IS NULL THEN
      SELECT id INTO v_supplier_id FROM suppliers WHERE is_active = TRUE LIMIT 1;
    ELSE
      v_supplier_id := v_product.preferred_supplier_id;
    END IF;
    
    -- Generate PO number
    v_po_number := generate_po_number_sequential();
    
    -- Create the purchase order
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
      notes,
      po_type
    ) VALUES (
      v_po_number,
      v_supplier_id,
      NEW.product_code,
      NEW.product_name,
      NEW.quantity, -- Order exact quantity needed
      COALESCE(v_product.cost, v_product.precio * 0.6), -- Use cost or 60% of price
      NEW.quantity * COALESCE(v_product.cost, v_product.precio * 0.6),
      'DRAFT',
      'automatica',
      'Auto-generada por backorder de orden ' || (SELECT order_number FROM sales_orders WHERE id = NEW.sales_order_id),
      'BACKORDER_FULFILLMENT'
    )
    RETURNING id INTO v_new_po_id;
    
    -- Link the PO to the sales order item
    UPDATE sales_order_items
    SET linked_purchase_order_id = v_new_po_id
    WHERE id = NEW.id;
    
    -- Log the automation
    INSERT INTO order_state_log (sales_order_id, from_state, to_state, notes, automated)
    VALUES (
      NEW.sales_order_id,
      NULL,
      'BACKORDER_PO_CREATED',
      'PO automática creada: ' || v_po_number,
      TRUE
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Attach trigger for auto PO creation
DROP TRIGGER IF EXISTS trg_auto_create_po_backorder ON sales_order_items;
CREATE TRIGGER trg_auto_create_po_backorder
  AFTER INSERT OR UPDATE ON sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_po_for_backorder();

-- 10. Enable RLS on order_state_log
ALTER TABLE order_state_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all order state logs"
  ON order_state_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert order state logs"
  ON order_state_log FOR INSERT
  WITH CHECK (true);

-- 11. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_fulfillment ON sales_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment ON sales_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created ON sales_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_state_log_order_id ON order_state_log(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_backorder ON sales_order_items(is_backorder) WHERE is_backorder = TRUE;
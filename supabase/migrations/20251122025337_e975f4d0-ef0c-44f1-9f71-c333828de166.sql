-- ==================================================================
-- AUTO-GENERATE PURCHASE ORDER WHEN PRODUCT HITS REORDER POINT
-- ==================================================================

-- Function: Auto-create draft PO when stock reaches ROP
CREATE OR REPLACE FUNCTION auto_create_po_at_reorder_point()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_vendor_id UUID;
  v_vendor_name TEXT;
  v_lead_time INT;
  v_po_number TEXT;
  v_suggested_qty INT;
  v_unit_cost NUMERIC;
  v_existing_po_count INT;
BEGIN
  -- Only trigger if:
  -- 1. ai_reorder_point is set
  -- 2. Stock just dropped to or below ROP
  -- 3. Product is not discontinued
  IF NEW.ai_reorder_point IS NOT NULL 
     AND NEW.cantidad_stock <= NEW.ai_reorder_point
     AND OLD.cantidad_stock > NEW.ai_reorder_point
     AND (NEW.is_discontinued = FALSE OR NEW.is_discontinued IS NULL)
  THEN
    
    -- Get vendor information
    IF NEW.vendor_id IS NOT NULL THEN
      SELECT id, name, lead_time_days
      INTO v_vendor_id, v_vendor_name, v_lead_time
      FROM vendors
      WHERE id = NEW.vendor_id AND is_active = TRUE;
    ELSE
      -- Get first active supplier if no vendor assigned
      SELECT id, name, lead_time_days
      INTO v_vendor_id, v_vendor_name, v_lead_time
      FROM suppliers
      WHERE is_active = TRUE
      LIMIT 1;
    END IF;
    
    -- If no vendor/supplier available, log and exit
    IF v_vendor_id IS NULL THEN
      RAISE NOTICE 'No active vendor/supplier found for product %. Skipping auto-PO creation.', NEW.product_code;
      RETURN NEW;
    END IF;
    
    -- Check if there's already a pending PO for this product (avoid duplicates)
    SELECT COUNT(*)
    INTO v_existing_po_count
    FROM purchase_orders
    WHERE product_code = NEW.product_code
      AND status IN ('DRAFT', 'SENT')
      AND created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    IF v_existing_po_count > 0 THEN
      RAISE NOTICE 'Product % already has % pending PO(s). Skipping auto-creation.', NEW.product_code, v_existing_po_count;
      RETURN NEW;
    END IF;
    
    -- Calculate suggested quantity: Target = ROP * 2, Order = Target - Current
    v_suggested_qty := GREATEST((NEW.ai_reorder_point * 2) - NEW.cantidad_stock, NEW.ai_reorder_point);
    
    -- Get unit cost (use cost field or 60% of sale price)
    v_unit_cost := COALESCE(NEW.cost, NEW.precio * 0.6);
    
    -- Generate PO number
    v_po_number := generate_po_number_sequential();
    
    -- Create draft Purchase Order
    INSERT INTO purchase_orders (
      order_number,
      supplier_id,
      vendor_id,
      product_code,
      product_name,
      quantity,
      unit_price,
      total_amount,
      status,
      order_type,
      po_type,
      priority,
      notes,
      expected_delivery_date
    ) VALUES (
      v_po_number,
      v_vendor_id, -- Using vendor as supplier
      NEW.vendor_id,
      NEW.product_code,
      NEW.nombre_producto,
      v_suggested_qty,
      v_unit_cost,
      v_suggested_qty * v_unit_cost,
      'DRAFT',
      'automatica',
      'STOCK_REPLENISHMENT',
      CASE
        WHEN NEW.cantidad_stock = 0 THEN 'URGENT'
        WHEN NEW.cantidad_stock <= (NEW.ai_reorder_point * 0.5) THEN 'HIGH'
        ELSE 'NORMAL'
      END,
      FORMAT(
        E'🤖 PO AUTO-GENERADA POR TRIGGER ROP\n\n' ||
        'Trigger: Stock alcanzó punto de reorden\n' ||
        'Stock actual: %s unidades\n' ||
        'Punto de reorden (AI): %s unidades\n' ||
        'Cantidad sugerida: %s unidades\n' ||
        'Target stock: %s unidades\n' ||
        'Proveedor: %s\n' ||
        'Lead time: %s días\n\n' ||
        '⚡ Revisar y enviar al proveedor.',
        NEW.cantidad_stock,
        NEW.ai_reorder_point,
        v_suggested_qty,
        NEW.ai_reorder_point * 2,
        v_vendor_name,
        COALESCE(v_lead_time, 15)
      ),
      CURRENT_DATE + INTERVAL '1 day' * COALESCE(v_lead_time, 15)
    );
    
    RAISE NOTICE '✅ Auto-created PO % for product % (Stock: %, ROP: %, Qty: %)',
      v_po_number, NEW.product_code, NEW.cantidad_stock, NEW.ai_reorder_point, v_suggested_qty;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_create_po_at_rop ON products;

-- Create trigger on products table
CREATE TRIGGER trigger_auto_create_po_at_rop
  AFTER UPDATE OF cantidad_stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_po_at_reorder_point();

-- Add helpful comment
COMMENT ON FUNCTION auto_create_po_at_reorder_point() IS 
  'Automatically creates draft Purchase Orders when product stock reaches or falls below ai_reorder_point. Prevents duplicate POs within 7 days.';

COMMENT ON TRIGGER trigger_auto_create_po_at_rop ON products IS
  'Triggers automatic PO creation when stock reaches reorder point calculated by AI.';
-- Trigger para notificar cuando se crea un nuevo pedido
CREATE OR REPLACE FUNCTION notify_new_sales_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT := 'https://pvgcrywkxzbgeywwhyqm.supabase.co';
  v_supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NyeXdreHpiZ2V5d3doeXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjY2NDUsImV4cCI6MjA3OTE0MjY0NX0.TUKAVhu5veF3DxYRJdrYM3IE0l4zWE5w8yia2knx5UM';
  v_urgency TEXT;
BEGIN
  -- Determinar urgencia basada en el total y estado
  IF NEW.total > 500 THEN
    v_urgency := 'HIGH';
  ELSIF NEW.total > 200 THEN
    v_urgency := 'MEDIUM';
  ELSE
    v_urgency := 'LOW';
  END IF;

  -- Enviar notificación (no bloqueante)
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/notify-business-event',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_supabase_anon_key
      ),
      body := jsonb_build_object(
        'event_type', 'NEW_SALES_ORDER',
        'event_data', jsonb_build_object(
          'order_number', NEW.order_number,
          'customer_name', NEW.customer_name,
          'total', NEW.total,
          'fulfillment_status', NEW.fulfillment_status,
          'payment_status', NEW.payment_status,
          'payment_method', NEW.payment_method,
          'source', NEW.source
        ),
        'urgency', v_urgency,
        'created_at', NEW.created_at,
        'reason', FORMAT('Nuevo pedido de %s por S/. %.2f', NEW.customer_name, NEW.total)
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error sending new order notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Crear trigger para sales_orders
DROP TRIGGER IF EXISTS notify_new_sales_order_trigger ON sales_orders;
CREATE TRIGGER notify_new_sales_order_trigger
  AFTER INSERT ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_sales_order();

-- Trigger para notificar cuando se crea una PO automática en DRAFT
CREATE OR REPLACE FUNCTION notify_auto_draft_po()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT := 'https://pvgcrywkxzbgeywwhyqm.supabase.co';
  v_supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NyeXdreHpiZ2V5d3doeXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjY2NDUsImV4cCI6MjA3OTE0MjY0NX0.TUKAVhu5veF3DxYRJdrYM3IE0l4zWE5w8yia2knx5UM';
  v_supplier_name TEXT;
  v_urgency TEXT;
BEGIN
  -- Solo notificar para POs automáticas en DRAFT
  IF NEW.order_type = 'automatica' AND NEW.status = 'DRAFT' THEN
    
    -- Obtener nombre del proveedor
    SELECT name INTO v_supplier_name
    FROM suppliers
    WHERE id = NEW.supplier_id;

    -- Determinar urgencia basada en prioridad
    v_urgency := CASE
      WHEN NEW.priority = 'URGENT' THEN 'URGENT'
      WHEN NEW.priority = 'HIGH' THEN 'HIGH'
      WHEN NEW.priority = 'NORMAL' THEN 'MEDIUM'
      ELSE 'LOW'
    END;

    -- Enviar notificación (no bloqueante)
    BEGIN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/notify-business-event',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_supabase_anon_key
        ),
        body := jsonb_build_object(
          'event_type', 'AUTO_PURCHASE_ORDER',
          'event_data', jsonb_build_object(
            'order_number', NEW.order_number,
            'product_name', NEW.product_name,
            'product_code', NEW.product_code,
            'quantity', NEW.quantity,
            'supplier_name', v_supplier_name,
            'priority', NEW.priority,
            'po_type', NEW.po_type,
            'total_amount', NEW.total_amount
          ),
          'urgency', v_urgency,
          'created_at', NEW.created_at,
          'reason', FORMAT('PO automática generada: %s - %s unidades de %s', 
            NEW.order_number, NEW.quantity, NEW.product_name)
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error sending auto PO notification: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger para purchase_orders
DROP TRIGGER IF EXISTS notify_auto_draft_po_trigger ON purchase_orders;
CREATE TRIGGER notify_auto_draft_po_trigger
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_auto_draft_po();
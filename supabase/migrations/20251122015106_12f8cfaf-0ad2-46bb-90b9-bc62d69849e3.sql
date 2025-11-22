-- Fix search_path for security (set search_path to public explicitly)

ALTER FUNCTION generate_sales_order_number() SET search_path = public;
ALTER FUNCTION generate_po_number_sequential() SET search_path = public;
ALTER FUNCTION log_order_state_change() SET search_path = public;
ALTER FUNCTION auto_create_po_for_backorder() SET search_path = public;
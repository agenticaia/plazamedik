-- Create a secure function to look up orders by order code
-- This allows the tracking page to work without exposing all orders
CREATE OR REPLACE FUNCTION public.get_order_by_code(lookup_code text)
RETURNS TABLE (
  id uuid,
  order_code text,
  customer_name text,
  customer_lastname text,
  customer_phone text,
  customer_district text,
  product_code text,
  product_name text,
  product_color text,
  product_price numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  source text,
  recommended_by text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_code,
    o.customer_name,
    o.customer_lastname,
    o.customer_phone,
    o.customer_district,
    o.product_code,
    o.product_name,
    o.product_color,
    o.product_price,
    o.status,
    o.created_at,
    o.updated_at,
    o.source,
    o.recommended_by
  FROM public.orders o
  WHERE o.order_code = lookup_code
  LIMIT 1;
END;
$$;
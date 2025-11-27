-- Add address and coordinates fields to sales_orders table
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_lat NUMERIC,
ADD COLUMN IF NOT EXISTS customer_lng NUMERIC;
-- Add priority and linked_sales_order_id fields to purchase_orders table

ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW'));

ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS linked_sales_order_id UUID REFERENCES sales_orders(id);

-- Add index for better performance when querying by linked sales order
CREATE INDEX IF NOT EXISTS idx_purchase_orders_linked_sales_order 
ON purchase_orders(linked_sales_order_id) WHERE linked_sales_order_id IS NOT NULL;

-- Add index for priority filtering
CREATE INDEX IF NOT EXISTS idx_purchase_orders_priority 
ON purchase_orders(priority);

COMMENT ON COLUMN purchase_orders.priority IS 'Priority level of the purchase order: URGENT, HIGH, NORMAL, LOW';
COMMENT ON COLUMN purchase_orders.linked_sales_order_id IS 'Optional reference to sales order for backorder fulfillment and cross-docking scenarios';
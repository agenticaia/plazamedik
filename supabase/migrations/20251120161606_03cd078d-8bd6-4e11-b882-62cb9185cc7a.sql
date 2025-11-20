-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT, -- e.g., "30 días", "60 días", "pago inmediato"
  lead_time_days INTEGER DEFAULT 7, -- días promedio de entrega
  rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'enviada', 'recibida', 'cancelada')),
  order_type TEXT DEFAULT 'manual' CHECK (order_type IN ('manual', 'automatica')),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  ai_recommendation JSONB, -- Almacena la recomendación de IA que generó esta orden
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to products table for supplier management
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS preferred_supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS is_discontinued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discontinue_reason TEXT,
ADD COLUMN IF NOT EXISTS discontinued_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 20;

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Admins can manage suppliers"
ON public.suppliers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active suppliers"
ON public.suppliers
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for purchase_orders
CREATE POLICY "Admins can manage purchase orders"
ON public.purchase_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION public.generate_purchase_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    new_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.purchase_orders WHERE order_number = new_number) INTO number_exists;
    IF NOT number_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$;

-- Insert initial suppliers
INSERT INTO public.suppliers (name, contact_person, email, phone, address, payment_terms, lead_time_days, rating)
VALUES 
  ('Atao Group', NULL, 'ventas@ataogroup.com', NULL, 'Lima, Perú', '30 días', 7, 4.50),
  ('Emancipacion Store', NULL, 'pedidos@emancipacion.com', NULL, 'Lima, Perú', '15 días', 5, 4.80);

-- Function to process purchase order received (updates stock)
CREATE OR REPLACE FUNCTION public.process_purchase_order_received(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_result JSON;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM public.purchase_orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Update product stock
  UPDATE public.products
  SET 
    cantidad_stock = cantidad_stock + v_order.quantity,
    updated_at = NOW()
  WHERE product_code = v_order.product_code;
  
  -- Update order status
  UPDATE public.purchase_orders
  SET 
    status = 'recibida',
    actual_delivery_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN json_build_object(
    'success', true,
    'order_number', v_order.order_number,
    'product_code', v_order.product_code,
    'quantity_received', v_order.quantity
  );
END;
$$;
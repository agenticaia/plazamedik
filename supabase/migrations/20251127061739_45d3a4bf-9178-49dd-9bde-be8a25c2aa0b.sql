-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  lastname TEXT,
  email TEXT,
  district TEXT,
  address TEXT,
  customer_type TEXT DEFAULT 'REGULAR',
  referral_code TEXT UNIQUE NOT NULL,
  referred_by_code TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  referral_credits NUMERIC DEFAULT 0,
  ai_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de referidos exitosos
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  referred_customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  referral_code_used TEXT NOT NULL,
  order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  credit_amount NUMERIC DEFAULT 15.00,
  status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_customer_id)
);

-- Agregar campo de código de referido usado en sales_orders
ALTER TABLE public.sales_orders 
ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON public.customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON public.sales_orders(customer_id);

-- Función para generar código de referido único
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar código de 6 caracteres aleatorio
    new_code := '15SO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(
      SELECT 1 FROM public.customers WHERE referral_code = new_code
    ) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger para crear/actualizar cliente automáticamente desde sales_order
CREATE OR REPLACE FUNCTION sync_customer_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- Buscar o crear cliente
  SELECT id, referral_code INTO v_customer_id, v_referral_code
  FROM customers
  WHERE phone = NEW.customer_phone
  LIMIT 1;
  
  IF v_customer_id IS NULL THEN
    -- Crear nuevo cliente
    v_referral_code := generate_referral_code();
    
    INSERT INTO customers (
      phone,
      name,
      lastname,
      district,
      address,
      referral_code,
      referred_by_code,
      total_orders,
      total_spent
    ) VALUES (
      NEW.customer_phone,
      NEW.customer_name,
      NEW.customer_lastname,
      NEW.customer_district,
      NEW.customer_address,
      v_referral_code,
      NEW.referral_code_used,
      1,
      NEW.total
    )
    RETURNING id INTO v_customer_id;
    
    -- Si usó código de referido, crear registro de referral
    IF NEW.referral_code_used IS NOT NULL THEN
      SELECT id INTO v_referrer_id
      FROM customers
      WHERE referral_code = NEW.referral_code_used;
      
      IF v_referrer_id IS NOT NULL THEN
        INSERT INTO referrals (
          referrer_customer_id,
          referred_customer_id,
          referral_code_used,
          order_id,
          credit_amount,
          status
        ) VALUES (
          v_referrer_id,
          v_customer_id,
          NEW.referral_code_used,
          NEW.id,
          15.00,
          'COMPLETED'
        );
        
        -- Dar créditos a ambos clientes
        UPDATE customers
        SET referral_credits = referral_credits + 15.00
        WHERE id IN (v_referrer_id, v_customer_id);
      END IF;
    END IF;
  ELSE
    -- Actualizar cliente existente
    UPDATE customers
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;
  
  -- Actualizar customer_id en la orden
  NEW.customer_id := v_customer_id;
  
  RETURN NEW;
END;
$$;

-- Trigger en sales_orders
DROP TRIGGER IF EXISTS sync_customer_trigger ON sales_orders;
CREATE TRIGGER sync_customer_trigger
BEFORE INSERT ON sales_orders
FOR EACH ROW
EXECUTE FUNCTION sync_customer_from_order();

-- RLS Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage referrals"
ON public.referrals
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read customers by phone"
ON public.customers
FOR SELECT
TO anon
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
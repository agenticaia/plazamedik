-- =====================================================
-- MIGRACIÓN ERP: Order to Cash + Procure to Pay (CORREGIDA)
-- =====================================================

-- 1. CREAR TABLA VENDORS (Reemplazo de suppliers con campos adicionales)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    payment_terms TEXT,
    lead_time_days INTEGER DEFAULT 7,
    performance_rating NUMERIC(3,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar datos de suppliers a vendors
INSERT INTO public.vendors (id, name, contact_person, email, phone, address, payment_terms, lead_time_days, is_active, notes, created_at, updated_at)
SELECT id, name, contact_person, email, phone, address, payment_terms, lead_time_days, is_active, notes, created_at, updated_at
FROM public.suppliers
ON CONFLICT (id) DO NOTHING;

-- 2. ACTUALIZAR TABLA PRODUCTS con campos AI
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ai_reorder_point INTEGER,
ADD COLUMN IF NOT EXISTS ai_churn_risk NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id);

-- Actualizar vendor_id desde preferred_supplier_id si existe
UPDATE public.products 
SET vendor_id = preferred_supplier_id 
WHERE preferred_supplier_id IS NOT NULL;

-- 3. CREAR TABLA SALES_ORDERS (Order to Cash - Header)
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_lastname TEXT,
    customer_phone TEXT,
    customer_district TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Separación crítica: Financiero vs Logístico
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PENDING', 'REFUNDED', 'CANCELLED')),
    fulfillment_status TEXT DEFAULT 'UNFULFILLED' CHECK (fulfillment_status IN ('UNFULFILLED', 'PARTIAL', 'FULFILLED', 'WAITING_STOCK', 'CANCELLED')),
    
    total NUMERIC(10,2) NOT NULL,
    source TEXT DEFAULT 'manual',
    recommended_by TEXT
);

-- 4. CREAR TABLA SALES_ORDER_ITEMS (Line Items con backorder logic)
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_color TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    
    -- Lógica estratégica de Cross-docking
    is_backorder BOOLEAN DEFAULT FALSE,
    linked_purchase_order_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MIGRAR DATOS de orders a sales_orders + sales_order_items
INSERT INTO public.sales_orders (
    id, order_number, customer_name, customer_lastname, customer_phone, 
    customer_district, created_at, updated_at, payment_status, fulfillment_status,
    total, source, recommended_by
)
SELECT 
    id,
    order_code,
    customer_name,
    customer_lastname,
    customer_phone,
    customer_district,
    created_at,
    updated_at,
    CASE 
        WHEN status = 'entregado' THEN 'PAID'
        WHEN status = 'cancelado' THEN 'CANCELLED'
        ELSE 'PENDING'
    END as payment_status,
    CASE 
        WHEN status = 'entregado' THEN 'FULFILLED'
        WHEN status = 'cancelado' THEN 'CANCELLED'
        WHEN status = 'enviado' THEN 'PARTIAL'
        ELSE 'UNFULFILLED'
    END as fulfillment_status,
    product_price as total,
    source,
    recommended_by
FROM public.orders
ON CONFLICT (order_number) DO NOTHING;

-- Crear line items desde orders (1 item por orden en el esquema antiguo)
INSERT INTO public.sales_order_items (
    sales_order_id, product_code, product_name, product_color, quantity, unit_price
)
SELECT 
    o.id,
    o.product_code,
    o.product_name,
    o.product_color,
    1 as quantity,
    o.product_price
FROM public.orders o
WHERE EXISTS (SELECT 1 FROM public.sales_orders so WHERE so.id = o.id);

-- 6. REESTRUCTURAR PURCHASE_ORDERS (Header)
-- CRÍTICO: Primero eliminar el constraint viejo
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_order_type_check;

-- Agregar nuevos campos
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS po_type TEXT DEFAULT 'STOCK_REPLENISHMENT',
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id);

-- Actualizar vendor_id desde supplier_id
UPDATE public.purchase_orders 
SET vendor_id = supplier_id 
WHERE supplier_id IS NOT NULL;

-- Actualizar status para usar nuevos valores (sin constraint activo)
UPDATE public.purchase_orders 
SET status = CASE 
    WHEN status = 'pendiente' THEN 'DRAFT'
    WHEN status = 'aprobada' THEN 'SENT'
    WHEN status = 'enviada' THEN 'SENT'
    WHEN status = 'recibida' THEN 'CLOSED'
    WHEN status = 'cancelada' THEN 'CANCELLED'
    ELSE status
END;

-- Ahora agregar los nuevos constraints
ALTER TABLE public.purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('DRAFT', 'SENT', 'PARTIAL_RECEIPT', 'CLOSED', 'CANCELLED'));

ALTER TABLE public.purchase_orders 
ADD CONSTRAINT purchase_orders_po_type_check 
CHECK (po_type IN ('STOCK_REPLENISHMENT', 'CROSS_DOCKING'));

-- 7. CREAR TABLA PURCHASE_ORDER_ITEMS (Con lógica de recepción parcial)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    
    qty_ordered INTEGER NOT NULL,
    qty_received INTEGER DEFAULT 0,
    
    cost_per_unit NUMERIC(10,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar datos existentes de purchase_orders a line items (1 producto por PO en esquema antiguo)
INSERT INTO public.purchase_order_items (
    purchase_order_id, product_code, product_name, qty_ordered, cost_per_unit
)
SELECT 
    id,
    product_code,
    product_name,
    quantity,
    unit_price
FROM public.purchase_orders;

-- 8. CREAR ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment_status ON public.sales_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_fulfillment_status ON public.sales_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_backorder ON public.sales_order_items(is_backorder);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON public.purchase_order_items(product_code);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(is_active);

-- 9. HABILITAR RLS en nuevas tablas
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 10. CREAR POLÍTICAS RLS
-- Vendors: Solo admins pueden gestionar
CREATE POLICY "Admins can manage vendors"
ON public.vendors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active vendors"
ON public.vendors FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

-- Sales Orders: Admins ven todo, público puede crear
CREATE POLICY "Public can create sales orders"
ON public.sales_orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all sales orders"
ON public.sales_orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales orders"
ON public.sales_orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sales Order Items: Sigue las mismas reglas que sales_orders
CREATE POLICY "Public can create sales order items"
ON public.sales_order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all sales order items"
ON public.sales_order_items FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales order items"
ON public.sales_order_items FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Purchase Order Items: Solo admins
CREATE POLICY "Admins can manage purchase order items"
ON public.purchase_order_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 11. TRIGGERS para updated_at
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at
    BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at
    BEFORE UPDATE ON public.purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
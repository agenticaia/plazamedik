-- Crear tabla de productos (migrar desde archivo estático)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  nombre_producto TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT,
  cantidad_stock INT DEFAULT 50,
  total_vendido INT DEFAULT 0,
  total_views INT DEFAULT 0,
  total_recommendations INT DEFAULT 0,
  avg_days_to_restock INT DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX idx_products_code ON public.products(product_code);
CREATE INDEX idx_products_categoria ON public.products(categoria);

-- Tabla de similitud de productos (precalculada)
CREATE TABLE IF NOT EXISTS public.product_similarity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id_1 TEXT NOT NULL,
  product_id_2 TEXT NOT NULL,
  similarity_score DECIMAL(3,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id_1, product_id_2)
);

CREATE INDEX idx_similarity_p1 ON public.product_similarity(product_id_1, similarity_score DESC);
CREATE INDEX idx_similarity_p2 ON public.product_similarity(product_id_2, similarity_score DESC);

-- Tabla de interacciones de usuario
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  product_code TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'click_recommendation', 'add_to_cart', 'purchase')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interactions_session ON public.user_interactions(session_id, created_at DESC);
CREATE INDEX idx_interactions_product ON public.user_interactions(product_code);

-- Tabla de predicción de inventario
CREATE TABLE IF NOT EXISTS public.inventory_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_demand INT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  current_stock INT NOT NULL,
  days_until_stockout INT,
  reorder_alert BOOLEAN DEFAULT FALSE,
  suggested_reorder_qty INT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_code, forecast_date)
);

CREATE INDEX idx_forecast_date ON public.inventory_forecast(forecast_date DESC);
CREATE INDEX idx_forecast_alert ON public.inventory_forecast(reorder_alert, product_code) WHERE reorder_alert = TRUE;

-- Tabla de logs de consumo IA
CREATE TABLE IF NOT EXISTS public.ai_consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL CHECK (feature IN ('recommendations', 'chatbot', 'forecast')),
  operation_type TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  api_calls INT DEFAULT 1,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consumption_feature ON public.ai_consumption_logs(feature, created_at DESC);

-- Modificar tabla orders existente (agregar campos para tracking de fuente)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'recommendation', 'chatbot')),
ADD COLUMN IF NOT EXISTS recommended_by TEXT;

-- Habilitar RLS en todas las tablas nuevas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_similarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_consumption_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para products (público puede leer, admin puede editar)
CREATE POLICY "Products are viewable by everyone" 
  ON public.products FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can update products" 
  ON public.products FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert products" 
  ON public.products FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para product_similarity (todos pueden leer)
CREATE POLICY "Product similarity is viewable by everyone" 
  ON public.product_similarity FOR SELECT 
  USING (true);

-- Políticas RLS para user_interactions (todos pueden insertar su propio tracking)
CREATE POLICY "Anyone can track interactions" 
  ON public.user_interactions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own interactions" 
  ON public.user_interactions FOR SELECT 
  USING (true);

-- Políticas RLS para inventory_forecast (solo admins)
CREATE POLICY "Only admins can view forecasts" 
  ON public.inventory_forecast FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para ai_consumption_logs (solo admins)
CREATE POLICY "Only admins can view AI logs" 
  ON public.ai_consumption_logs FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at en products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
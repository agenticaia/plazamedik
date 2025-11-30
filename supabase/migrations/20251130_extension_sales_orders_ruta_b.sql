-- ============================================
-- MIGRACIÓN: Extensión de sales_orders para Ruta B (WhatsApp Manual)
-- Fecha: 2025-11-30
-- Descripción: Agregar campos necesarios para flujo de ingreso manual desde WhatsApp
-- ============================================

-- 1. Extender tabla sales_orders con campos de Ruta B
-- ============================================

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  ruta TEXT DEFAULT 'web_form' CHECK (ruta IN ('web_form', 'whatsapp_manual'));

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  latitud DECIMAL(10, 8);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  longitud DECIMAL(11, 8);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  url_google_maps VARCHAR(500);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  referencia_adicional VARCHAR(300);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  asignado_a_vendedor_id UUID;

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  asignado_a_vendedor_nombre VARCHAR(100);

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  estado_confirmacion VARCHAR(50) DEFAULT 'pendiente' 
  CHECK (estado_confirmacion IN ('pendiente', 'confirmado_cliente', 'rechazado'));

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  timestamp_envio_wa TIMESTAMP;

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  timestamp_confirmacion_cliente TIMESTAMP;

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS 
  comprobante_prepago VARCHAR(500);

-- 2. Agregar Foreign Key para vendedor (si no existe)
-- ============================================

-- Verificar si la columna asignado_a_vendedor_id no tiene FK
-- Si no tiene, crear la restricción
DO $$ 
BEGIN
  -- Intentar agregar la restricción
  ALTER TABLE sales_orders 
    ADD CONSTRAINT fk_sales_orders_vendedor 
    FOREIGN KEY (asignado_a_vendedor_id) 
    REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN 
  -- La restricción ya existe, ignorar
  NULL;
END $$;

-- 3. Crear índices para performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_orders_ruta 
  ON sales_orders(ruta);

CREATE INDEX IF NOT EXISTS idx_sales_orders_vendedor 
  ON sales_orders(asignado_a_vendedor_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_coords 
  ON sales_orders(latitud, longitud);

CREATE INDEX IF NOT EXISTS idx_sales_orders_estado_confirmacion 
  ON sales_orders(estado_confirmacion);

CREATE INDEX IF NOT EXISTS idx_sales_orders_timestamp_registro_desc 
  ON sales_orders(created_at DESC);

-- 4. Crear tabla de vendedores (maestro)
-- ============================================

CREATE TABLE IF NOT EXISTS vendedores (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(15),
  foto_perfil VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  pedidos_asignados INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendedores_is_active 
  ON vendedores(is_active);

-- 5. Crear tabla para auditoría de cambios WA
-- ============================================

CREATE TABLE IF NOT EXISTS pedidos_wa_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  evento VARCHAR(100) NOT NULL,
  detalles JSONB,
  timestamp_evento TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_wa_log_order_id 
  ON pedidos_wa_log(sales_order_id);

CREATE INDEX IF NOT EXISTS idx_pedidos_wa_log_evento 
  ON pedidos_wa_log(evento);

-- 6. Crear vista para análisis de Ruta B
-- ============================================

CREATE OR REPLACE VIEW v_pedidos_whatsapp_manual AS
SELECT 
  so.id,
  so.order_number as codigo_pedido,
  so.created_at as fecha_registro,
  so.customer_name,
  so.customer_phone,
  so.customer_district,
  so.latitud,
  so.longitud,
  so.url_google_maps,
  so.asignado_a_vendedor_nombre as vendedor,
  so.fulfillment_status as estado_logistica,
  so.payment_status as estado_pago,
  so.estado_confirmacion,
  so.total,
  so.timestamp_envio_wa,
  so.timestamp_confirmacion_cliente,
  so.delivered_at,
  CASE 
    WHEN so.timestamp_confirmacion_cliente IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (so.timestamp_confirmacion_cliente - so.created_at)) / 60 
    ELSE NULL 
  END as tiempo_respuesta_cliente_minutos,
  CASE 
    WHEN so.delivered_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (so.delivered_at - so.created_at)) / 1440 
    ELSE NULL 
  END as tiempo_entrega_dias,
  COUNT(soi.id) as cantidad_items
FROM sales_orders so
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
WHERE so.ruta = 'whatsapp_manual'
GROUP BY so.id
ORDER BY so.created_at DESC;

-- 7. Función para actualizar nombre de vendedor automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_vendedor_nombre_on_assign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si se asigna un vendedor, obtener su nombre de la tabla vendedores
  IF NEW.asignado_a_vendedor_id IS NOT NULL THEN
    SELECT nombre INTO NEW.asignado_a_vendedor_nombre
    FROM vendedores
    WHERE id = NEW.asignado_a_vendedor_id;
  ELSE
    NEW.asignado_a_vendedor_nombre := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trg_update_vendedor_nombre ON sales_orders;
CREATE TRIGGER trg_update_vendedor_nombre
  BEFORE INSERT OR UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_vendedor_nombre_on_assign();

-- 8. Crear tabla de configuración de plantillas WA
-- ============================================

CREATE TABLE IF NOT EXISTS plantillas_wa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  categoria VARCHAR(50),
  contenido TEXT NOT NULL,
  variables JSONB, -- Array de variables como {{nombre_cliente}}, {{producto}}, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar plantilla por defecto para confirmación
INSERT INTO plantillas_wa (nombre, categoria, contenido, variables, is_active) VALUES
(
  'confirmacion_pedido_whatsapp',
  'pedidos',
  '¡Hola {{nombre_cliente}} 👋

Recibimos tu pedido {{codigo_pedido}}

📦 Producto: {{nombre_producto}}
💰 Precio: S/ {{precio}}
📍 Destino: {{direccion}} (Ubicación confirmada ✅)

⏱️ Entrega: Mañana 9am-5pm

Para autorizar que salga el motorizado, responde aquí:
👉 CONFIRMO

Si prefieres pagar ahora con Yape/Plin y recibir {{descuento}}, avísame.

Gracias por confiar en PlazaMedik 🏥',
  '["nombre_cliente", "codigo_pedido", "nombre_producto", "precio", "direccion", "descuento"]'::jsonb,
  TRUE
)
ON CONFLICT (nombre) DO NOTHING;

-- 9. Crear tabla para rastrear mensajes WA enviados
-- ============================================

CREATE TABLE IF NOT EXISTS wa_messages_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50),
  status VARCHAR(50), -- sent, delivered, read, failed
  message_body TEXT,
  wa_message_id VARCHAR(100),
  timestamp_sent TIMESTAMP DEFAULT NOW(),
  timestamp_delivered TIMESTAMP,
  timestamp_read TIMESTAMP,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_log_order_id 
  ON wa_messages_log(sales_order_id);

CREATE INDEX IF NOT EXISTS idx_wa_messages_log_status 
  ON wa_messages_log(status);

-- 10. Actualizar comentarios de base de datos
-- ============================================

COMMENT ON COLUMN sales_orders.ruta IS 
'Identifica la ruta de pedido: web_form (Ruta A - formulario web) o whatsapp_manual (Ruta B - ingreso manual desde WhatsApp)';

COMMENT ON COLUMN sales_orders.latitud IS 
'Latitud de coordenadas GPS exactas de la dirección de entrega (WGS84)';

COMMENT ON COLUMN sales_orders.longitud IS 
'Longitud de coordenadas GPS exactas de la dirección de entrega (WGS84)';

COMMENT ON COLUMN sales_orders.url_google_maps IS 
'URL corta de Google Maps proporcionada por el cliente/vendedor para validar ubicación';

COMMENT ON COLUMN sales_orders.referencia_adicional IS 
'Información adicional para el motorizado (ej: "frente al parque, puerta roja", "apartamento 202")';

COMMENT ON COLUMN sales_orders.asignado_a_vendedor_id IS 
'ID del usuario vendedor responsable de este pedido (especialmente importante en Ruta B)';

COMMENT ON COLUMN sales_orders.asignado_a_vendedor_nombre IS 
'Nombre desnormalizado del vendedor para queries más rápidas';

COMMENT ON COLUMN sales_orders.estado_confirmacion IS 
'Estado de confirmación específico de Ruta B: pendiente (esperando confirmación del cliente), confirmado_cliente (cliente respondió CONFIRMO), rechazado (cliente canceló)';

COMMENT ON COLUMN sales_orders.timestamp_envio_wa IS 
'Marca de tiempo cuando se envió el mensaje de confirmación WhatsApp al cliente';

COMMENT ON COLUMN sales_orders.timestamp_confirmacion_cliente IS 
'Marca de tiempo cuando el cliente respondió con confirmación (respuesta "CONFIRMO")';

COMMENT ON COLUMN sales_orders.comprobante_prepago IS 
'Ruta de archivo/URL del comprobante de transferencia si se optó por prepago';

COMMENT ON TABLE vendedores IS 
'Tabla maestra de vendedores. Desnormalizamos datos de auth.users para queries más rápidas';

COMMENT ON TABLE pedidos_wa_log IS 
'Auditoría de eventos importantes en pedidos Ruta B (envío WA, confirmación, cambios de estado)';

COMMENT ON TABLE wa_messages_log IS 
'Histórico completo de mensajes WhatsApp enviados para auditoría y debugging';

-- 11. Row Level Security (RLS) - Vendedores solo ven sus pedidos
-- ============================================

-- NOTA: Ejecutar estas políticas solo si RLS está habilitado en sales_orders
-- ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Vendedores ven solo sus pedidos asignados"
--   ON sales_orders FOR SELECT
--   USING (
--     auth.uid() = asignado_a_vendedor_id 
--     OR auth.jwt() ->> 'role' = 'admin'
--   );

-- CREATE POLICY "Admins ven todos los pedidos"
--   ON sales_orders FOR SELECT
--   USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Vendedores pueden actualizar estado de sus pedidos"
--   ON sales_orders FOR UPDATE
--   USING (
--     auth.uid() = asignado_a_vendedor_id 
--     OR auth.jwt() ->> 'role' = 'admin'
--   );

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================



-- ============================================
-- MIGRACIÓN: Extensión de sales_orders para Ruta B (WhatsApp Manual)
-- ============================================

-- 1. Extender tabla sales_orders con campos de Ruta B
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

-- 2. Crear índices para performance
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

-- 3. Crear tabla de vendedores (maestro)
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

-- 4. Crear tabla para auditoría de cambios WA
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

-- 5. Crear vista para análisis de Ruta B
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
GROUP BY so.id;

-- 6. Función para actualizar nombre de vendedor automáticamente
CREATE OR REPLACE FUNCTION update_vendedor_nombre_on_assign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trg_update_vendedor_nombre ON sales_orders;
CREATE TRIGGER trg_update_vendedor_nombre
  BEFORE INSERT OR UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_vendedor_nombre_on_assign();

-- 7. Crear tabla de configuración de plantillas WA
CREATE TABLE IF NOT EXISTS plantillas_wa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  categoria VARCHAR(50),
  contenido TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

-- 8. Crear tabla para rastrear mensajes WA enviados
CREATE TABLE IF NOT EXISTS wa_messages_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50),
  status VARCHAR(50),
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

-- 9. Habilitar RLS en nuevas tablas
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_wa_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_wa ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages_log ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para vendedores
CREATE POLICY "Admins pueden gestionar vendedores"
  ON vendedores FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendedores pueden ver su propio registro"
  ON vendedores FOR SELECT
  USING (id = auth.uid());

-- 11. Políticas RLS para pedidos_wa_log
CREATE POLICY "Admins pueden gestionar pedidos_wa_log"
  ON pedidos_wa_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema puede insertar logs"
  ON pedidos_wa_log FOR INSERT
  WITH CHECK (true);

-- 12. Políticas RLS para plantillas_wa
CREATE POLICY "Admins pueden gestionar plantillas"
  ON plantillas_wa FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios pueden ver plantillas activas"
  ON plantillas_wa FOR SELECT
  USING (is_active = true);

-- 13. Políticas RLS para wa_messages_log
CREATE POLICY "Admins pueden gestionar wa_messages_log"
  ON wa_messages_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema puede insertar mensajes"
  ON wa_messages_log FOR INSERT
  WITH CHECK (true);

-- 14. Comentarios de documentación
COMMENT ON COLUMN sales_orders.ruta IS 
'Identifica la ruta de pedido: web_form (Ruta A) o whatsapp_manual (Ruta B)';

COMMENT ON COLUMN sales_orders.latitud IS 
'Latitud GPS de la dirección de entrega (WGS84)';

COMMENT ON COLUMN sales_orders.longitud IS 
'Longitud GPS de la dirección de entrega (WGS84)';

COMMENT ON COLUMN sales_orders.estado_confirmacion IS 
'Estado de confirmación Ruta B: pendiente, confirmado_cliente, rechazado';

COMMENT ON TABLE vendedores IS 
'Tabla maestra de vendedores para asignación de pedidos';

COMMENT ON TABLE pedidos_wa_log IS 
'Auditoría de eventos de pedidos Ruta B';

COMMENT ON TABLE wa_messages_log IS 
'Histórico de mensajes WhatsApp enviados';

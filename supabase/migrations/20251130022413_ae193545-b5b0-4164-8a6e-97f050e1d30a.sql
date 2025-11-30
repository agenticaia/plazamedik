-- Migración: Crear tabla pedidos para Ruta A y Ruta B
-- Fecha: 2025-11-30
-- Propósito: Sistema de gestión de pedidos WhatsApp + Web Form

-- 1. Crear ENUMs
CREATE TYPE pedido_ruta AS ENUM ('web_form', 'whatsapp_manual');
CREATE TYPE pedido_estado AS ENUM ('borrador', 'pendiente_confirmacion', 'confirmado', 'en_ruta', 'entregado', 'cancelado');
CREATE TYPE pedido_metodo_pago AS ENUM ('cod', 'yape', 'plin', 'transferencia', 'tarjeta');
CREATE TYPE pedido_confirmacion AS ENUM ('pendiente', 'confirmado_cliente', 'rechazado', 'sin_respuesta');

-- 2. Crear secuencia para códigos
CREATE SEQUENCE IF NOT EXISTS seq_pedido_numero START 1000;

-- 3. Tabla principal PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  
  -- CLIENTE
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_apellido VARCHAR(100),
  cliente_telefono VARCHAR(15) NOT NULL,
  cliente_email VARCHAR(100),
  cliente_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- ORIGEN Y RUTA
  ruta pedido_ruta DEFAULT 'web_form',
  origen_pagina VARCHAR(50),
  timestamp_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- UBICACIÓN
  distrito VARCHAR(100) NOT NULL,
  direccion_completa VARCHAR(500) NOT NULL,
  referencia_adicional VARCHAR(300),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  url_google_maps VARCHAR(500),
  
  -- PRODUCTOS (JSON Array)
  productos JSONB NOT NULL DEFAULT '[]',
  precio_total DECIMAL(10, 2) NOT NULL,
  cantidad_items INTEGER NOT NULL DEFAULT 1,
  
  -- PAGO
  metodo_pago pedido_metodo_pago DEFAULT 'cod',
  comprobante_prepago_url VARCHAR(500),
  confirmacion_pago BOOLEAN DEFAULT FALSE,
  
  -- ESTADO
  estado pedido_estado DEFAULT 'pendiente_confirmacion',
  estado_confirmacion pedido_confirmacion DEFAULT 'pendiente',
  
  -- ASIGNACIÓN A VENDEDOR
  asignado_a_vendedor_id UUID,
  asignado_a_vendedor_nombre VARCHAR(100),
  
  -- TRACKING
  timestamp_envio_wa TIMESTAMP WITH TIME ZONE,
  timestamp_confirmacion_cliente TIMESTAMP WITH TIME ZONE,
  timestamp_en_ruta TIMESTAMP WITH TIME ZONE,
  timestamp_entregado TIMESTAMP WITH TIME ZONE,
  codigo_seguimiento VARCHAR(50),
  
  -- AUDITORÍA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  notas_internas TEXT,
  
  CONSTRAINT telefono_email_check CHECK (
    cliente_telefono IS NOT NULL OR cliente_email IS NOT NULL
  )
);

-- 4. Tabla de HISTORIAL DE CAMBIOS
CREATE TABLE IF NOT EXISTS pedidos_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  campo_modificado VARCHAR(100),
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_id UUID,
  usuario_email VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de EVENTOS Y NOTIFICACIONES
CREATE TABLE IF NOT EXISTS pedidos_eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo_evento VARCHAR(50) NOT NULL,
  descripcion TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de MÉTRICAS Y KPIs
CREATE TABLE IF NOT EXISTS pedidos_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tiempo_respuesta_cliente BIGINT,
  tiempo_confirmacion_vendedor BIGINT,
  tiempo_entrega_total BIGINT,
  tasa_conversion BOOLEAN,
  valor_ticket DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla de ESTADÍSTICAS por VENDEDOR
CREATE TABLE IF NOT EXISTS pedidos_vendedor_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id UUID NOT NULL,
  fecha_stats DATE DEFAULT CURRENT_DATE,
  total_pedidos_hoy INTEGER DEFAULT 0,
  total_confirmados_hoy INTEGER DEFAULT 0,
  total_entregados_hoy INTEGER DEFAULT 0,
  total_cancelados_hoy INTEGER DEFAULT 0,
  ingreso_diario DECIMAL(10, 2) DEFAULT 0,
  promedio_ticket DECIMAL(10, 2) DEFAULT 0,
  tiempo_promedio_confirmacion BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendedor_id, fecha_stats)
);

-- 8. Crear ÍNDICES
CREATE INDEX idx_pedidos_telefono ON pedidos(cliente_telefono);
CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_ruta ON pedidos(ruta);
CREATE INDEX idx_pedidos_vendedor ON pedidos(asignado_a_vendedor_id);
CREATE INDEX idx_pedidos_fecha ON pedidos(timestamp_registro DESC);
CREATE INDEX idx_pedidos_distrito ON pedidos(distrito);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_metodo_pago ON pedidos(metodo_pago);
CREATE INDEX idx_pedidos_auditoria_pedido_id ON pedidos_auditoria(pedido_id);
CREATE INDEX idx_pedidos_auditoria_timestamp ON pedidos_auditoria(timestamp DESC);
CREATE INDEX idx_pedidos_eventos_tipo ON pedidos_eventos(tipo_evento);
CREATE INDEX idx_pedidos_eventos_timestamp ON pedidos_eventos(timestamp DESC);
CREATE INDEX idx_pedidos_kpis_pedido_id ON pedidos_kpis(pedido_id);
CREATE INDEX idx_pedidos_kpis_created_at ON pedidos_kpis(created_at DESC);
CREATE INDEX idx_pedidos_vendedor_stats_fecha ON pedidos_vendedor_stats(fecha_stats DESC);

-- 9. Habilitar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_vendedor_stats ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para PEDIDOS (usando has_role existente)
CREATE POLICY "Admins pueden gestionar pedidos" ON pedidos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendedores ver asignados" ON pedidos
  FOR SELECT USING (asignado_a_vendedor_id = auth.uid());

CREATE POLICY "Clientes ver propios" ON pedidos
  FOR SELECT USING (cliente_id IN (SELECT id FROM customers WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'));

CREATE POLICY "Público puede crear pedidos" ON pedidos
  FOR INSERT WITH CHECK (true);

-- 11. Políticas RLS para tablas auxiliares
CREATE POLICY "Admins ver auditoria" ON pedidos_auditoria
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema puede insertar auditoria" ON pedidos_auditoria
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins ver eventos" ON pedidos_eventos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema puede insertar eventos" ON pedidos_eventos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins ver kpis" ON pedidos_kpis
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins ver stats vendedor" ON pedidos_vendedor_stats
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendedores ver propias stats" ON pedidos_vendedor_stats
  FOR SELECT USING (vendedor_id = auth.uid());

-- 12. Función para generar código de pedido
CREATE OR REPLACE FUNCTION generar_codigo_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'PED-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                  LPAD(NEXTVAL('seq_pedido_numero')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_generar_codigo_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_pedido();

-- 13. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_pedidos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_actualizar_updated_at_pedidos
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at_pedidos();

-- 14. Función para registrar auditoría de cambios de estado
CREATE OR REPLACE FUNCTION registrar_auditoria_pedidos()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO pedidos_auditoria (
      pedido_id, campo_modificado, valor_anterior, valor_nuevo,
      usuario_id
    ) VALUES (
      NEW.id,
      'estado',
      OLD.estado::TEXT,
      NEW.estado::TEXT,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_registrar_auditoria_pedidos
AFTER UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION registrar_auditoria_pedidos();

-- 15. Comentarios de documentación
COMMENT ON TABLE pedidos IS 'Tabla principal de pedidos - Soporta Ruta A (Web Form) y Ruta B (WhatsApp Manual)';
COMMENT ON COLUMN pedidos.ruta IS 'web_form = Ruta A (Cliente llena form) | whatsapp_manual = Ruta B (Vendedor ingresa)';
COMMENT ON COLUMN pedidos.estado IS 'Ciclo de vida: borrador → pendiente_confirmacion → confirmado → en_ruta → entregado';
COMMENT ON COLUMN pedidos.productos IS 'JSON: [{id: UUID, nombre: string, precio: number, cantidad: number, color: string}]';
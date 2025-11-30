-- Migración: Crear tabla pedidos para Ruta A y Ruta B
-- Fecha: 2025-11-30
-- Propósito: Sistema de gestión de pedidos WhatsApp + Web Form

-- 1. Crear ENUM para ruta
CREATE TYPE pedido_ruta AS ENUM ('web_form', 'whatsapp_manual');

-- 2. Crear ENUM para estado
CREATE TYPE pedido_estado AS ENUM ('borrador', 'pendiente_confirmacion', 'confirmado', 'en_ruta', 'entregado', 'cancelado');

-- 3. Crear ENUM para método de pago
CREATE TYPE pedido_metodo_pago AS ENUM ('cod', 'yape', 'plin', 'transferencia', 'tarjeta');

-- 4. Crear ENUM para estado de confirmación
CREATE TYPE pedido_confirmacion AS ENUM ('pendiente', 'confirmado_cliente', 'rechazado', 'sin_respuesta');

-- 5. Tabla principal PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL, -- ORD-2025-1005
  
  -- CLIENTE (Información Personal)
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_apellido VARCHAR(100),
  cliente_telefono VARCHAR(15) NOT NULL,
  cliente_email VARCHAR(100),
  cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- ORIGEN Y RUTA
  ruta pedido_ruta DEFAULT 'web_form',
  origen_pagina VARCHAR(50), -- Para Ruta A: 'home', 'catalog', 'blog', etc.
  timestamp_registro TIMESTAMP DEFAULT NOW(),
  
  -- UBICACIÓN (Crítico para Courier)
  distrito VARCHAR(100) NOT NULL,
  direccion_completa VARCHAR(500) NOT NULL,
  referencia_adicional VARCHAR(300),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  url_google_maps VARCHAR(500),
  
  -- PRODUCTOS (JSON Array)
  productos JSONB NOT NULL DEFAULT '[]', 
  -- Estructura: [{id, nombre, precio, cantidad, color, imagen_url}]
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
  asignado_a_vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  asignado_a_vendedor_nombre VARCHAR(100),
  
  -- TRACKING (Timestamps importantes)
  timestamp_envio_wa TIMESTAMP,
  timestamp_confirmacion_cliente TIMESTAMP,
  timestamp_en_ruta TIMESTAMP,
  timestamp_entregado TIMESTAMP,
  codigo_seguimiento VARCHAR(50), -- Del courier (Olva, Shalom, etc)
  
  -- AUDITORÍA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  notas_internas TEXT,
  
  -- Restricción: al menos uno debe estar presente
  CONSTRAINT telefonoEmail_check CHECK (
    cliente_telefono IS NOT NULL OR cliente_email IS NOT NULL
  )
);

-- 6. Crear ÍNDICES para performance
CREATE INDEX idx_pedidos_telefono ON pedidos(cliente_telefono);
CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_ruta ON pedidos(ruta);
CREATE INDEX idx_pedidos_vendedor ON pedidos(asignado_a_vendedor_id);
CREATE INDEX idx_pedidos_fecha ON pedidos(timestamp_registro DESC);
CREATE INDEX idx_pedidos_distrito ON pedidos(distrito);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_metodo_pago ON pedidos(metodo_pago);

-- 7. Tabla de HISTORIAL DE CAMBIOS (Auditoría detallada)
CREATE TABLE IF NOT EXISTS pedidos_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  campo_modificado VARCHAR(100),
  valor_anterior TEXT,
  valor_nuevo TEXT,
  
  usuario_id UUID REFERENCES auth.users(id),
  usuario_email VARCHAR(255),
  
  timestamp TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_pedidos_auditoria_pedido_id (pedido_id),
  INDEX idx_pedidos_auditoria_timestamp (timestamp DESC)
);

-- 8. Tabla de EVENTOS Y NOTIFICACIONES
CREATE TABLE IF NOT EXISTS pedidos_eventos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  tipo_evento VARCHAR(50) NOT NULL, -- 'creado', 'confirmado', 'enviado_wa', 'en_ruta', 'entregado', 'cancelado'
  descripcion TEXT,
  
  timestamp TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_pedidos_eventos_tipo (tipo_evento),
  INDEX idx_pedidos_eventos_timestamp (timestamp DESC)
);

-- 9. Tabla de MÉTRICAS Y KPIs
CREATE TABLE IF NOT EXISTS pedidos_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  -- Tiempos (en segundos)
  tiempo_respuesta_cliente BIGINT, -- desde envío WA a confirmación
  tiempo_confirmacion_vendedor BIGINT, -- de ingreso a confirmación
  tiempo_entrega_total BIGINT, -- desde creación a entregado
  
  -- Análisis
  tasa_conversion BOOLEAN, -- si fue confirmado
  valor_ticket DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_pedidos_kpis_pedido_id (pedido_id),
  INDEX idx_pedidos_kpis_created_at (created_at DESC)
);

-- 10. Tabla de ESTADÍSTICAS por VENDEDOR
CREATE TABLE IF NOT EXISTS pedidos_vendedor_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_stats DATE DEFAULT CURRENT_DATE,
  
  total_pedidos_hoy INTEGER DEFAULT 0,
  total_confirmados_hoy INTEGER DEFAULT 0,
  total_entregados_hoy INTEGER DEFAULT 0,
  total_cancelados_hoy INTEGER DEFAULT 0,
  
  ingreso_diario DECIMAL(10, 2) DEFAULT 0,
  promedio_ticket DECIMAL(10, 2) DEFAULT 0,
  tiempo_promedio_confirmacion BIGINT DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(vendedor_id, fecha_stats),
  INDEX idx_pedidos_vendedor_stats_fecha (fecha_stats DESC)
);

-- 11. Habilitar RLS (Row Level Security)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_vendedor_stats ENABLE ROW LEVEL SECURITY;

-- 12. Políticas RLS para PEDIDOS
-- Admins: ver todos
CREATE POLICY "Admins ver todos los pedidos" ON pedidos
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Admins: CRUD completo
CREATE POLICY "Admins CRUD pedidos" ON pedidos
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Vendedores: ver solo asignados
CREATE POLICY "Vendedores ver asignados" ON pedidos
  FOR SELECT USING (asignado_a_vendedor_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Clientes: ver solo propios (por teléfono o email)
CREATE POLICY "Clientes ver propios" ON pedidos
  FOR SELECT USING (
    cliente_id = auth.uid() OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- 13. Políticas RLS para AUDITORIA
CREATE POLICY "Auditoria solo lectura admin" ON pedidos_auditoria
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 14. Triggers para actualizar UPDATED_AT
CREATE OR REPLACE FUNCTION actualizar_updated_at_pedidos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_pedidos
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION actualizar_updated_at_pedidos();

-- 15. Trigger para registrar cambios en AUDITORIA
CREATE OR REPLACE FUNCTION registrar_auditoria_pedidos()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS DISTINCT FROM NEW THEN
    INSERT INTO pedidos_auditoria (
      pedido_id, campo_modificado, valor_anterior, valor_nuevo,
      usuario_id, usuario_email
    ) VALUES (
      NEW.id,
      'estado',
      OLD.estado::TEXT,
      NEW.estado::TEXT,
      auth.uid(),
      auth.jwt() ->> 'email'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_auditoria_pedidos
AFTER UPDATE ON pedidos
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION registrar_auditoria_pedidos();

-- 16. Trigger para generar CÓDIGO de pedido automático
CREATE OR REPLACE FUNCTION generar_codigo_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                  LPAD(NEXTVAL('seq_pedido_numero')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear secuencia para códigos
CREATE SEQUENCE IF NOT EXISTS seq_pedido_numero START 1000;

CREATE TRIGGER trigger_generar_codigo_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_pedido();

-- 17. Grant permisos para usuarios autenticados
GRANT SELECT ON pedidos TO authenticated;
GRANT INSERT ON pedidos TO authenticated;
GRANT UPDATE ON pedidos TO authenticated;
GRANT SELECT ON pedidos_auditoria TO authenticated;
GRANT SELECT ON pedidos_eventos TO authenticated;
GRANT SELECT ON pedidos_kpis TO authenticated;
GRANT SELECT ON pedidos_vendedor_stats TO authenticated;

-- 18. Comentarios de documentación
COMMENT ON TABLE pedidos IS 'Tabla principal de pedidos - Soporta Ruta A (Web Form) y Ruta B (WhatsApp Manual)';
COMMENT ON COLUMN pedidos.ruta IS 'web_form = Ruta A (Cliente llena form) | whatsapp_manual = Ruta B (Vendedor ingresa)';
COMMENT ON COLUMN pedidos.estado IS 'Ciclo de vida: borrador → pendiente_confirmacion → confirmado → en_ruta → entregado';
COMMENT ON COLUMN pedidos.productos IS 'JSON: [{id: UUID, nombre: string, precio: number, cantidad: number, color: string}]';
COMMENT ON COLUMN pedidos.latitud IS 'Coordenadas de Google Maps - Crítico para courier';
COMMENT ON COLUMN pedidos.longitud IS 'Coordenadas de Google Maps - Crítico para courier';

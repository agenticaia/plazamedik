-- Migración: Tabla de Campañas de WhatsApp
-- Fecha: 2024-11-30
-- Descripción: Sistema de campañas de marketing y notificaciones automáticas por WhatsApp

-- ============================================================================
-- TABLA: campanas_whatsapp
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campanas_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información básica
  nombre TEXT NOT NULL,
  descripcion TEXT,
  template TEXT NOT NULL, -- Nombre del template de Kapso.ai
  
  -- Segmentación
  segmento JSONB NOT NULL DEFAULT '{"type": "all"}'::jsonb,
  -- Ejemplo: {"type": "distrito", "filters": {"distritos": ["Miraflores", "San Isidro"]}}
  -- Ejemplo: {"type": "monto_gastado", "filters": {"montoMinimo": 100, "montoMaximo": 500}}
  
  -- Programación
  programada TIMESTAMPTZ, -- Fecha/hora de envío programado (null = enviar ahora)
  ejecutada TIMESTAMPTZ, -- Fecha/hora de ejecución real
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviando', 'completada', 'cancelada')),
  
  -- Destinatarios
  total_destinatarios INTEGER DEFAULT 0,
  destinatarios JSONB, -- Lista de teléfonos y datos para envío
  
  -- Estadísticas
  estadisticas JSONB DEFAULT '{
    "total": 0,
    "enviados": 0,
    "entregados": 0,
    "leidos": 0,
    "respondidos": 0,
    "fallidos": 0
  }'::jsonb,
  
  -- Configuración adicional
  variables JSONB, -- Variables personalizadas para el template
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_campanas_estado ON public.campanas_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_campanas_programada ON public.campanas_whatsapp(programada) WHERE programada IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campanas_created_at ON public.campanas_whatsapp(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_campanas_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campanas_whatsapp_updated_at
  BEFORE UPDATE ON public.campanas_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION update_campanas_whatsapp_updated_at();

-- ============================================================================
-- TABLA: mensajes_whatsapp
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mensajes_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relaciones
  campana_id UUID REFERENCES public.campanas_whatsapp(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  
  -- Información del mensaje
  message_id TEXT, -- ID del mensaje en Kapso/WhatsApp
  telefono TEXT NOT NULL,
  template TEXT NOT NULL,
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'enviando' CHECK (estado IN ('enviando', 'enviado', 'entregado', 'leido', 'fallido', 'respondido')),
  error_mensaje TEXT,
  
  -- Contenido
  contenido JSONB, -- Contenido del mensaje enviado
  respuesta JSONB, -- Respuesta del cliente (si la hay)
  
  -- Timestamps
  enviado_at TIMESTAMPTZ,
  entregado_at TIMESTAMPTZ,
  leido_at TIMESTAMPTZ,
  respondido_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mensajes_campana ON public.mensajes_whatsapp(campana_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_pedido ON public.mensajes_whatsapp(pedido_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_telefono ON public.mensajes_whatsapp(telefono);
CREATE INDEX IF NOT EXISTS idx_mensajes_estado ON public.mensajes_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_message_id ON public.mensajes_whatsapp(message_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_mensajes_whatsapp_updated_at
  BEFORE UPDATE ON public.mensajes_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION update_campanas_whatsapp_updated_at();

-- ============================================================================
-- TABLA: webhooks_whatsapp
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhooks_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información del webhook
  tipo TEXT NOT NULL CHECK (tipo IN ('message', 'status', 'unknown')),
  payload JSONB NOT NULL,
  
  -- Procesamiento
  procesado BOOLEAN DEFAULT FALSE,
  procesado_at TIMESTAMPTZ,
  error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhooks_procesado ON public.webhooks_whatsapp(procesado);
CREATE INDEX IF NOT EXISTS idx_webhooks_tipo ON public.webhooks_whatsapp(tipo);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON public.webhooks_whatsapp(created_at DESC);

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para actualizar estadísticas de campaña
CREATE OR REPLACE FUNCTION actualizar_estadisticas_campana(p_campana_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.campanas_whatsapp
  SET estadisticas = jsonb_build_object(
    'total', (SELECT COUNT(*) FROM public.mensajes_whatsapp WHERE campana_id = p_campana_id),
    'enviados', (SELECT COUNT(*) FROM public.mensajes_whatsapp WHERE campana_id = p_campana_id AND estado IN ('enviado', 'entregado', 'leido', 'respondido')),
    'entregados', (SELECT COUNT(*) FROM public.mensajes_whatsapp WHERE campana_id = p_campana_id AND estado IN ('entregado', 'leido', 'respondido')),
    'leidos', (SELECT COUNT(*) FROM public.mensajes_whatsapp WHERE campana_id = p_campana_id AND estado IN ('leido', 'respondido')),
    'respondidos', (SELECT COUNT(*) FROM public.mensajes_whatsapp WHERE campana_id = p_campana_id AND estado = 'respondido'),
    'fallidos', (SELECT COUNT(*) FROM public.mensajes_whatsapp WHERE campana_id = p_campana_id AND estado = 'fallido')
  )
  WHERE id = p_campana_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas automáticamente
CREATE OR REPLACE FUNCTION trigger_actualizar_estadisticas_campana()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campana_id IS NOT NULL THEN
    PERFORM actualizar_estadisticas_campana(NEW.campana_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mensajes_actualizar_estadisticas
  AFTER INSERT OR UPDATE ON public.mensajes_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_estadisticas_campana();

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.campanas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas para campanas_whatsapp
CREATE POLICY "Admins pueden ver todas las campañas"
  ON public.campanas_whatsapp FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden crear campañas"
  ON public.campanas_whatsapp FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden actualizar campañas"
  ON public.campanas_whatsapp FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden eliminar campañas"
  ON public.campanas_whatsapp FOR DELETE
  USING (auth.role() = 'authenticated');

-- Políticas para mensajes_whatsapp
CREATE POLICY "Admins pueden ver todos los mensajes"
  ON public.mensajes_whatsapp FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden crear mensajes"
  ON public.mensajes_whatsapp FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins pueden actualizar mensajes"
  ON public.mensajes_whatsapp FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Políticas para webhooks_whatsapp
CREATE POLICY "Service role puede gestionar webhooks"
  ON public.webhooks_whatsapp FOR ALL
  USING (true);

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Insertar campaña de ejemplo
INSERT INTO public.campanas_whatsapp (nombre, template, segmento, estado)
VALUES 
  ('Bienvenida Nuevos Clientes', 'order_confirmation', '{"type": "all"}', 'borrador'),
  ('Promoción Verano 2024', 'special_promotion', '{"type": "distrito", "filters": {"distritos": ["Miraflores", "San Isidro", "Surco"]}}', 'borrador')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.campanas_whatsapp IS 'Campañas de marketing y notificaciones automáticas por WhatsApp';
COMMENT ON TABLE public.mensajes_whatsapp IS 'Registro de mensajes individuales enviados por WhatsApp';
COMMENT ON TABLE public.webhooks_whatsapp IS 'Log de webhooks recibidos de Kapso.ai para procesamiento';

COMMENT ON COLUMN public.campanas_whatsapp.segmento IS 'Configuración de segmentación de clientes en formato JSONB';
COMMENT ON COLUMN public.campanas_whatsapp.estadisticas IS 'Estadísticas de la campaña actualizadas automáticamente';
COMMENT ON COLUMN public.mensajes_whatsapp.message_id IS 'ID del mensaje en la API de Kapso/WhatsApp';
COMMENT ON COLUMN public.mensajes_whatsapp.estado IS 'Estado del mensaje: enviando, enviado, entregado, leido, fallido, respondido';

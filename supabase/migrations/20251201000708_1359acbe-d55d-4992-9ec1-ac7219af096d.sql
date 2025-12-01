-- 1. Tabla de Campañas
CREATE TABLE IF NOT EXISTS public.campanas_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  template TEXT NOT NULL,
  segmento JSONB NOT NULL DEFAULT '{"type": "all"}'::jsonb,
  programada TIMESTAMPTZ,
  ejecutada TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'programada', 'enviando', 'completada', 'cancelada')),
  total_destinatarios INTEGER DEFAULT 0,
  destinatarios JSONB,
  estadisticas JSONB DEFAULT '{"total": 0, "enviados": 0, "entregados": 0, "leidos": 0, "respondidos": 0, "fallidos": 0}'::jsonb,
  variables JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Mensajes Individuales
CREATE TABLE IF NOT EXISTS public.mensajes_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campana_id UUID REFERENCES public.campanas_whatsapp(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
  message_id TEXT,
  telefono TEXT NOT NULL,
  template TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'enviando' CHECK (estado IN ('enviando', 'enviado', 'entregado', 'leido', 'fallido', 'respondido')),
  error_mensaje TEXT,
  contenido JSONB,
  respuesta JSONB,
  enviado_at TIMESTAMPTZ,
  entregado_at TIMESTAMPTZ,
  leido_at TIMESTAMPTZ,
  respondido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Webhooks (Logs)
CREATE TABLE IF NOT EXISTS public.webhooks_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('message', 'status', 'unknown')),
  payload JSONB NOT NULL,
  procesado BOOLEAN DEFAULT FALSE,
  procesado_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_campanas_estado ON public.campanas_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_campana ON public.mensajes_whatsapp(campana_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_telefono ON public.mensajes_whatsapp(telefono);

-- 5. Función para actualizar estadísticas automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_estadisticas_campana(p_campana_id UUID)
RETURNS VOID 
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- 6. Trigger de estadísticas
CREATE OR REPLACE FUNCTION public.trigger_actualizar_estadisticas_campana()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.campana_id IS NOT NULL THEN
    PERFORM actualizar_estadisticas_campana(NEW.campana_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_mensajes_actualizar_estadisticas ON public.mensajes_whatsapp;
CREATE TRIGGER trigger_mensajes_actualizar_estadisticas
  AFTER INSERT OR UPDATE ON public.mensajes_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_actualizar_estadisticas_campana();

-- 7. Habilitar Seguridad (RLS)
ALTER TABLE public.campanas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (Solo Admins tienen acceso)
CREATE POLICY "Admins full access campanas" 
ON public.campanas_whatsapp 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins full access mensajes" 
ON public.mensajes_whatsapp 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access webhooks" 
ON public.webhooks_whatsapp 
FOR ALL 
USING (true);
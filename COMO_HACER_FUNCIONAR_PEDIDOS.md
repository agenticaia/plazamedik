# 🚀 Cómo Hacer que Funcionen los Pedidos

## Estado Actual

✅ **Formulario de crear pedido**: Funciona perfectamente  
✅ **Validación**: Todo validado correctamente  
✅ **Código único**: Se genera automáticamente (ORD-2025-XXXXX)  
❌ **Tabla pedidos en Supabase**: NO EXISTE AÚN  

## Problema

Cuando creas un pedido, se intenta guardar en `pedidos` table pero **la migración no se ha ejecutado en Supabase remoto**.

El sistema tiene fallback a `sales_orders`, pero eso no es ideal.

## Solución (3 opciones)

### ✅ OPCIÓN 1: Via Supabase Dashboard (MÁS FÁCIL) - Recomendado

1. **Abre** https://supabase.com/dashboard/project/lqeevfvrtifsidfghtwz/sql/new

2. **Copia TODA la siguiente SQL** (debajo):

```sql
-- ============================================
-- 1. CREAR TIPOS ENUM
-- ============================================

CREATE TYPE IF NOT EXISTS pedido_ruta AS ENUM ('web_form', 'whatsapp_manual');
CREATE TYPE IF NOT EXISTS pedido_estado AS ENUM ('borrador', 'pendiente_confirmacion', 'confirmado', 'en_ruta', 'entregado', 'cancelado');
CREATE TYPE IF NOT EXISTS pedido_metodo_pago AS ENUM ('cod', 'yape', 'plin', 'transferencia', 'tarjeta');
CREATE TYPE IF NOT EXISTS pedido_confirmacion AS ENUM ('pendiente', 'confirmado_cliente', 'rechazado', 'sin_respuesta');

-- ============================================
-- 2. CREAR TABLA PEDIDOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  
  -- CLIENTE
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_apellido VARCHAR(100),
  cliente_telefono VARCHAR(15) NOT NULL,
  cliente_email VARCHAR(100),
  cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- ORIGEN Y RUTA
  ruta pedido_ruta DEFAULT 'web_form',
  origen_pagina VARCHAR(50),
  timestamp_registro TIMESTAMP DEFAULT NOW(),
  
  -- UBICACIÓN
  distrito VARCHAR(100) NOT NULL,
  direccion_completa VARCHAR(500) NOT NULL,
  referencia_adicional VARCHAR(300),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  url_google_maps VARCHAR(500),
  
  -- PRODUCTOS (JSON)
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
  
  -- ASIGNACIÓN
  asignado_a_vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  asignado_a_vendedor_nombre VARCHAR(100),
  
  -- TRACKING
  timestamp_envio_wa TIMESTAMP,
  timestamp_confirmacion_cliente TIMESTAMP,
  timestamp_en_ruta TIMESTAMP,
  timestamp_entregado TIMESTAMP,
  codigo_seguimiento VARCHAR(50),
  
  -- AUDITORÍA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  notas_internas TEXT,
  
  CONSTRAINT telefonoEmail_check CHECK (
    cliente_telefono IS NOT NULL OR cliente_email IS NOT NULL
  )
);

-- ============================================
-- 3. CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pedidos_telefono ON public.pedidos(cliente_telefono);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON public.pedidos(codigo);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_ruta ON public.pedidos(ruta);
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON public.pedidos(asignado_a_vendedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON public.pedidos(timestamp_registro DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_distrito ON public.pedidos(distrito);

-- ============================================
-- 4. HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREAR POLÍTICAS RLS
-- ============================================

-- Los usuarios autenticados pueden leer pedidos (completo)
CREATE POLICY IF NOT EXISTS "Autenticados pueden leer pedidos" 
ON public.pedidos FOR SELECT 
USING (auth.role() = 'authenticated');

-- Los usuarios autenticados pueden crear pedidos
CREATE POLICY IF NOT EXISTS "Autenticados pueden crear pedidos" 
ON public.pedidos FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden actualizar sus propios pedidos
CREATE POLICY IF NOT EXISTS "Actualizar propios pedidos" 
ON public.pedidos FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Los admin (tabla roles) pueden actualizar cualquier pedido
CREATE POLICY IF NOT EXISTS "Admin puede actualizar cualquier pedido" 
ON public.pedidos FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.roles WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.roles WHERE role = 'admin'
  )
);
```

3. **Pega en el editor** (Ctrl+V o Cmd+V)

4. **Haz clic en ▶️ Execute** (o presiona Ctrl+Enter)

5. **Espera** a que termine (deberías ver ✅ en verde)

6. **Listo** ✨ La tabla está creada

### ✅ OPCIÓN 2: Usando el archivo SQL local

1. **Abre el archivo**:
   ```
   supabase/migrations/20251130_crear_tabla_pedidos.sql
   ```

2. **Copia TODO** el contenido

3. **Pégalo en Supabase Dashboard → SQL Editor**

4. **Ejecuta**

### ✅ OPCIÓN 3: Con Supabase CLI (si lo tienes instalado)

```bash
cd /workspaces/plazamedik
supabase db push
```

---

## Después de Ejecutar la Migración

### ✅ Verifica que funcionó

En Supabase Dashboard → SQL Editor, ejecuta:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'pedidos';
```

Deberías ver: `pedidos` en los resultados

### ✅ Ahora puedes crear pedidos

1. **Abre** http://localhost:8080/admin/pedidos/create
2. **Llena el formulario** completamente
3. **Haz clic** en "Guardar y Enviar WA"
4. **Verifica en** http://localhost:8080/admin/pedidos

Ahora el pedido aparecerá en la lista ✨

---

## Recordatorio

- El sistema **genera automáticamente** el código del pedido (ORD-2025-XXXXX)
- Los datos se guardan en la tabla `pedidos`
- La tabla tiene **auditoría automática** (created_by, updated_by, timestamps)
- RLS está habilitado para **seguridad**

## ¿Problemas?

Si aún no aparecen los pedidos:

1. **Recarga la página** (Ctrl+F5)
2. **Revisa la consola del navegador** (F12 → Console)
3. **Verifica Network tab** (F12 → Network) - busca errores 4xx o 5xx
4. **Contacta con soporte** compartiendo el error exacto

---

**¿Hiciste los cambios?** Comparte el resultado de la consola si hay errores 📋

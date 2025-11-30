# 📊 ANÁLISIS DETALLADO: Estructura de BD Actual vs. Requerimientos WhatsApp

---

## 🎯 SITUACIÓN ACTUAL

### **Tabla Principal Actual: `sales_orders`**

```sql
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY,
  order_number TEXT UNIQUE,
  
  -- Cliente
  customer_name TEXT NOT NULL,
  customer_lastname TEXT,
  customer_phone TEXT,
  customer_district TEXT,
  customer_address TEXT,
  customer_id UUID (OPCIONAL),
  
  -- Totales
  total NUMERIC(10,2),
  
  -- Estados Duales
  payment_status ENUM('PAID', 'PENDING', 'REFUNDED', 'CANCELLED'),
  fulfillment_status ENUM('UNFULFILLED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'PARTIAL', 'WAITING_STOCK', 'CANCELLED'),
  
  -- Tracking
  tracking_number TEXT,
  courier TEXT,
  
  -- Timestamps Automáticos
  picking_started_at TIMESTAMP,
  packed_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Campos Adicionales
  source TEXT DEFAULT 'manual', -- manual | recommendation | chatbot
  recommended_by TEXT,
  payment_method TEXT,
  notes TEXT,
  priority TEXT,
  customer_type TEXT
);
```

### **Tabla Relacionada: `sales_order_items`**

```sql
CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY,
  sales_order_id UUID REFERENCES sales_orders(id),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_color TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2),
  is_backorder BOOLEAN DEFAULT FALSE,
  linked_purchase_order_id UUID (Para cross-docking),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 FLUJO ACTUAL vs. FLUJO REQUERIDO

### **Flujo Actual (RUTA A - Web Form)**

```
Cliente llena form web (/hacer-pedido-wa)
         ↓
create-sales-order function
         ↓
INSERT sales_orders + sales_order_items
         ↓
AUTO-TRIGGER: Valida stock
         ↓
¿Hay Stock? ├─ SÍ → fulfillment_status = UNFULFILLED
           └─ NO  → fulfillment_status = WAITING_STOCK
                   + AUTO INSERT purchase_order (backorder)
         ↓
Pedido creado (estado RECIBIDO)
```

### **Flujo Requerido (RUTA B - Ingreso Manual del Vendedor)**

```
Vendedor accede a /admin/pedidos/create
         ↓
Ingresa datos del cliente desde chat WA
         ↓
Selecciona producto(s)
         ↓
Ingresa ubicación + Google Maps coords
         ↓
[Guardar y Enviar Confirmación WA]
         ↓
INSERT pedidos + items (similar a sales_orders)
         ↓
ENVÍO AUTOMÁTICO: Mensaje WA predefinido
         ↓
Cliente responde "CONFIRMO"
         ↓
Estado: Confirmado → Courier puede buscar
```

---

## 📋 PROBLEMAS IDENTIFICADOS & SOLUCIONES

### **Problema 1: La tabla `sales_orders` NO tiene campos para Ruta B (WhatsApp Manual)**

**Campos FALTANTES para Ruta B:**

| Campo Requerido | Actual | Problema | Solución |
|---|---|---|---|
| `ruta` | ❌ NO | Imposible filtrar por Ruta A vs B | ADD: `ruta ENUM('web_form', 'whatsapp_manual')` |
| `latitud` | ❌ NO | No almacena coordenadas exactas | Renombrar `customer_lat` o ADD `latitud` |
| `longitud` | ❌ NO | No almacena coordenadas exactas | Renombrar `customer_lng` o ADD `longitud` |
| `url_google_maps` | ❌ NO | No captura el link de Maps | ADD `url_google_maps TEXT` |
| `referencia_adicional` | ❌ NO | Falta info para motorizado | ADD `referencia_adicional TEXT` |
| `asignado_a_vendedor_id` | ❌ NO | No se asigna vendedor en Ruta B | ADD `asignado_a_vendedor_id UUID REFERENCES auth.users(id)` |
| `estado_confirmacion` | ❌ NO | No diferencia "Confirmado por cliente" | ADD `estado_confirmacion ENUM(...)` |
| `timestamp_envio_wa` | ❌ NO | No sabe cuándo se envió WA | ADD `timestamp_envio_wa TIMESTAMP` |
| `timestamp_confirmacion_cliente` | ❌ NO | No mide tiempo respuesta cliente | ADD `timestamp_confirmacion_cliente TIMESTAMP` |
| `comprobante_prepago` | ❌ NO | No almacena comprobante de pago | ADD `comprobante_prepago VARCHAR(500)` |

---

### **Problema 2: Falta tabla `order_state_log` para auditoría**

**Solución:** Existe `order_state_log` pero falta documentación completa.

```sql
CREATE TABLE order_state_log (
  id UUID PRIMARY KEY,
  sales_order_id UUID REFERENCES sales_orders(id),
  from_state TEXT,
  to_state TEXT,
  changed_by UUID REFERENCES auth.users(id),
  automated BOOLEAN DEFAULT FALSE,
  notes TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Problema 3: Tabla `orders` antigua (REDUNDANTE)**

**Existe una tabla `orders` antigua con:**
```sql
CREATE TABLE orders (
  order_code TEXT UNIQUE,
  customer_name, customer_lastname, customer_phone,
  product_code, product_name, product_color, product_price,
  status ENUM('recibido', 'preparacion', 'enviado', 'entregado', 'cancelado'),
  source ENUM('manual', 'recommendation', 'chatbot'),
  ...
)
```

**⚠️ PROBLEMA:** 
- `orders` y `sales_orders` compiten por la misma funcionalidad
- `orders` tiene estructura SIMPLE (un producto por orden)
- `sales_orders` tiene estructura COMPLEJA (múltiples items por orden)
- La función `sync_product_sales_from_orders()` copia datos de `orders` → `sales_orders`

**RECOMENDACIÓN:**
- ✅ Usar `sales_orders` como tabla única
- ❌ DEPRECAR `orders` (mantener solo para datos históricos)
- 🔄 Migrar datos si hay dependencias

---

## 🛠️ CAMBIOS NECESARIOS EN BD

### **PASO 1: Extender `sales_orders` con campos de Ruta B**

```sql
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS:
  ruta TEXT DEFAULT 'web_form' CHECK (ruta IN ('web_form', 'whatsapp_manual')),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  url_google_maps VARCHAR(500),
  referencia_adicional VARCHAR(300),
  asignado_a_vendedor_id UUID REFERENCES auth.users(id),
  asignado_a_vendedor_nombre VARCHAR(100),
  estado_confirmacion VARCHAR(50) DEFAULT 'pendiente',
  timestamp_envio_wa TIMESTAMP,
  timestamp_confirmacion_cliente TIMESTAMP,
  comprobante_prepago VARCHAR(500),
  codigo_seguimiento VARCHAR(50);
```

### **PASO 2: Agregar índices para performance**

```sql
CREATE INDEX IF NOT EXISTS idx_sales_orders_ruta 
  ON sales_orders(ruta);

CREATE INDEX IF NOT EXISTS idx_sales_orders_vendedor 
  ON sales_orders(asignado_a_vendedor_id);

CREATE INDEX IF NOT EXISTS idx_sales_orders_coords 
  ON sales_orders(latitud, longitud);

CREATE INDEX IF NOT EXISTS idx_sales_orders_estado_conf 
  ON sales_orders(estado_confirmacion);

CREATE INDEX IF NOT EXISTS idx_sales_orders_timestamp_registro 
  ON sales_orders(created_at DESC);
```

### **PASO 3: Crear tabla `vendedores` (si no existe)**

```sql
CREATE TABLE vendedores (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(15),
  foto_perfil VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 COMPARATIVA: ESTRUCTURA ACTUAL vs. REQUERIDA

### **RUTA A (Web Form) - YA FUNCIONAL**

| Aspecto | Estado | Detalles |
|---|---|---|
| Tabla | ✅ EXISTE | `sales_orders` |
| Ingreso Datos | ✅ AUTOMÁTICO | Via función `create-sales-order` |
| Validación Stock | ✅ TRIGGER | Auto-crea backorder si falta stock |
| Items Múltiples | ✅ SOPORTA | Tabla `sales_order_items` |
| Coordenadas | ⚠️ PARCIAL | `customer_lat`, `customer_lng` (renombrar) |
| Asignación Vendedor | ❌ NO EXISTE | Falta `asignado_a_vendedor_id` |
| Origen Identificado | ✅ SÍ | Campo `source` = 'manual' \| 'recommendation' \| 'chatbot' |

### **RUTA B (WhatsApp Manual) - REQUIERE CAMBIOS**

| Aspecto | Estado | Detalles |
|---|---|---|
| Tabla | ✅ REUTILIZAR | Misma tabla `sales_orders` |
| Ingreso Datos | ❌ NO EXISTE | Falta formulario en `/admin/pedidos/create` |
| Validación Stock | ✅ TRIGGER | Mismo trigger que Ruta A |
| Items Múltiples | ✅ SOPORTA | Tabla `sales_order_items` |
| Coordenadas | ❌ FALTA | Necesita `latitud`, `longitud`, `url_google_maps` |
| Asignación Vendedor | ❌ FALTA | Necesita `asignado_a_vendedor_id` |
| Origen Identificado | ⚠️ MANUAL | Hay que setear `ruta = 'whatsapp_manual'` |
| Envío WA Confirmación | ❌ FALTA | Integración con WhatsApp Business API |
| Confirmación Cliente | ❌ FALTA | Escuchar respuesta "CONFIRMO" |

---

## 🔧 CÓMO CAMBIA LA ESTRUCTURA

### **Antes (Actual - Solo Ruta A)**

```
┌─────────────────────────────────────┐
│      sales_orders                   │
├─────────────────────────────────────┤
│ ✅ order_number                     │
│ ✅ customer_name/phone/district     │
│ ✅ payment_status, fulfillment_...  │
│ ✅ created_at, updated_at           │
│ ❌ NO ruta                          │
│ ❌ NO asignado_a_vendedor_id        │
│ ❌ NO latitud/longitud              │
│ ❌ NO referencia_adicional          │
└─────────────────────────────────────┘
        ↓
    [SOLO RUTA A - Web Form]
    
Vendedor = Sistema automático
Ubicación = Basada en address string
Origen = Siempre web_form
```

### **Después (Propuesto - Ruta A + B)**

```
┌──────────────────────────────────────┐
│      sales_orders (MEJORADA)        │
├──────────────────────────────────────┤
│ ✅ order_number                      │
│ ✅ customer_name/phone/district      │
│ ✅ payment_status, fulfillment_...   │
│ ✅ created_at, updated_at            │
│ ✨ ruta (web_form | whatsapp_manual) │
│ ✨ asignado_a_vendedor_id (FK)       │
│ ✨ latitud, longitud (coords exactas)│
│ ✨ url_google_maps                   │
│ ✨ referencia_adicional              │
│ ✨ timestamp_envio_wa                │
│ ✨ estado_confirmacion               │
└──────────────────────────────────────┘
        ↙              ↘
    RUTA A         RUTA B
  (Web Form)    (WhatsApp Manual)
    |               |
 Auto-registro   Vendedor ingresa
    |               |
 Coords string   Coords exactas
    |               |
   Sistema      Vendedor asignado
```

---

## 💾 KARDEX/HISTORIAL PROPUESTO

### **Nueva Vista: `v_pedidos_analytics`**

```sql
CREATE VIEW v_pedidos_analytics AS
SELECT 
  so.id,
  so.order_number,
  so.ruta,
  so.created_at::DATE as fecha,
  EXTRACT(HOUR FROM so.created_at) as hora,
  so.asignado_a_vendedor_nombre as vendedor,
  so.customer_name,
  so.total,
  CASE 
    WHEN so.fulfillment_status = 'DELIVERED' THEN 1 ELSE 0 
  END as completado,
  CASE 
    WHEN so.fulfillment_status = 'CANCELLED' THEN 1 ELSE 0 
  END as cancelado,
  EXTRACT(EPOCH FROM (COALESCE(so.timestamp_confirmacion_cliente, now()) - so.created_at)) / 60 
    as tiempo_respuesta_cliente_min,
  EXTRACT(EPOCH FROM (so.delivered_at - so.created_at)) / 1440 
    as tiempo_entrega_dias
FROM sales_orders so
WHERE so.ruta = 'whatsapp_manual'
ORDER BY so.created_at DESC;
```

---

## 🚀 RESUMEN DE CAMBIOS

| # | Cambio | Tabla | Tipo | Impacto |
|---|---|---|---|---|
| 1 | ADD `ruta` | sales_orders | ALTER | BAJO - Nuevo campo |
| 2 | ADD `latitud`, `longitud` | sales_orders | ALTER | BAJO - Nuevos campos |
| 3 | ADD `url_google_maps` | sales_orders | ALTER | BAJO - Nuevo campo |
| 4 | ADD `referencia_adicional` | sales_orders | ALTER | BAJO - Nuevo campo |
| 5 | ADD `asignado_a_vendedor_id` | sales_orders | ALTER | BAJO - Nuevo FK |
| 6 | ADD `estado_confirmacion` | sales_orders | ALTER | BAJO - Nuevo campo |
| 7 | ADD timestamps WA | sales_orders | ALTER | BAJO - Nuevos campos |
| 8 | Crear índices | sales_orders | CREATE | BAJO - Mejora performance |
| 9 | DEPRECAR `orders` | orders | DEPRECATE | MEDIO - Usar solo sales_orders |
| 10 | Crear tabla `vendedores` | vendedores | CREATE | BAJO - Datos maestros |

---

## 🎓 CONCLUSIÓN

**La tabla `sales_orders` está BIEN DISEÑADA pero INCOMPLETA para Ruta B.**

**Acciones Inmediatas:**
1. ✅ Ejecutar migraciones SQL (ALTER TABLE)
2. ✅ Crear tabla `vendedores`
3. ✅ Crear componentes React `/admin/pedidos/create` y `/admin/pedidos/[id]/edit`
4. ✅ Integrar Google Maps API
5. ✅ Integrar WhatsApp Business API
6. ❌ NO crear tabla nueva - Reutilizar `sales_orders`


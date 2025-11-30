# 📊 ANÁLISIS COMPLETO: BD Actual → Estructura Requerida para Ruta B

> **Creado:** 30 Noviembre 2025  
> **Para:** Sistema de Gestión de Pedidos PlazaMedik  
> **Autor:** Análisis Técnico Completo

---

## 🎯 RESUMEN EJECUTIVO

### **Situación Actual**
- ✅ Tabla `sales_orders` existe y funciona para Ruta A (Web Form)
- ✅ Sistema de stock y backorder automático implementado
- ⚠️ Tabla es INCOMPLETA para Ruta B (WhatsApp Manual)
- ❌ **10 campos críticos FALTANTES**
- ❌ **2 tablas FALTANTES** (vendedores, wa_messages_log)

### **Solución Propuesta**
- Extender `sales_orders` con 10 nuevos campos
- NO crear tabla nueva (reutilizar sales_orders)
- Crear tablas auxiliares (vendedores, wa_messages_log)
- Implementar componentes React para Ruta B

### **Impacto**
- 📈 **Cobertura de Ruta B:** 0% → 100%
- 📈 **Coordenadas exactas:** 60% → 100%
- 📈 **Asignación vendedor:** 0% → 100%
- ⏱️ **Tiempo implementación:** 2 semanas

---

## 📋 TABLA ACTUAL: `sales_orders`

```
┌─────────────────────────────────────────────────────────┐
│                   sales_orders                          │
├─────────────────────────────────────────────────────────┤
│ CAMPO                      │ TIPO        │ RUTA A │ RUTA B
├────────────────────────────┼─────────────┼────────┼────────
│ id                         │ UUID        │ ✅     │ ✅
│ order_number               │ TEXT UNIQUE │ ✅     │ ✅
│ customer_name              │ TEXT        │ ✅     │ ✅
│ customer_lastname          │ TEXT        │ ✅     │ ✅
│ customer_phone             │ TEXT        │ ✅     │ ✅
│ customer_district          │ TEXT        │ ✅     │ ✅
│ customer_address           │ TEXT        │ ✅     │ ⚠️ String
│ customer_lat               │ DECIMAL     │ ⚠️     │ ⚠️ Incorrecto
│ customer_lng               │ DECIMAL     │ ⚠️     │ ⚠️ Incorrecto
│ total                      │ NUMERIC     │ ✅     │ ✅
│ payment_status             │ ENUM        │ ✅     │ ✅
│ fulfillment_status         │ ENUM        │ ✅     │ ✅
│ picking_started_at         │ TIMESTAMP   │ ✅     │ ✅
│ packed_at                  │ TIMESTAMP   │ ✅     │ ✅
│ shipped_at                 │ TIMESTAMP   │ ✅     │ ✅
│ delivered_at               │ TIMESTAMP   │ ✅     │ ✅
│ tracking_number            │ TEXT        │ ✅     │ ✅
│ courier                    │ TEXT        │ ✅     │ ✅
│ created_at                 │ TIMESTAMP   │ ✅     │ ✅
│ updated_at                 │ TIMESTAMP   │ ✅     │ ✅
│ source                     │ TEXT        │ ✅     │ ⚠️ Confuso
│ recommended_by             │ TEXT        │ ✅     │ ⚠️
│ payment_method             │ TEXT        │ ✅     │ ✅
│ priority                   │ TEXT        │ ✅     │ ✅
│ customer_type              │ TEXT        │ ✅     │ ✅
│ notes                      │ TEXT        │ ✅     │ ✅
│ customer_id                │ UUID FK     │ ✅     │ ✅
│                            │             │        │
│ ❌ ruta                    │ TEXT        │ ✅     │ ❌ FALTA
│ ❌ latitud                 │ DECIMAL     │ ⚠️     │ ❌ FALTA
│ ❌ longitud                │ DECIMAL     │ ⚠️     │ ❌ FALTA
│ ❌ url_google_maps         │ VARCHAR     │ ✅     │ ❌ FALTA
│ ❌ referencia_adicional    │ VARCHAR     │ ✅     │ ❌ FALTA
│ ❌ asignado_a_vendedor_id  │ UUID FK     │ ✅     │ ❌ FALTA
│ ❌ asignado_a_vendedor_nom │ VARCHAR     │ ✅     │ ❌ FALTA
│ ❌ estado_confirmacion     │ VARCHAR     │ ✅     │ ❌ FALTA
│ ❌ timestamp_envio_wa      │ TIMESTAMP   │ ✅     │ ❌ FALTA
│ ❌ timestamp_confirmacion  │ TIMESTAMP   │ ✅     │ ❌ FALTA
│ ❌ comprobante_prepago     │ VARCHAR     │ ✅     │ ❌ FALTA
└─────────────────────────────────────────────────────────┘
```

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### **Problema #1: Falta Diferenciación de Ruta**

```
Situación Actual:
┌──────────────────────┐
│  Todos los pedidos    │
│  parecen iguales      │
│  No se sabe si:       │
│  • Vino de web        │
│  • O de WhatsApp      │
│  • O de recomendación │
└──────────────────────┘

✅ Solución:
ALTER TABLE sales_orders ADD COLUMN ruta TEXT 
  DEFAULT 'web_form' 
  CHECK (ruta IN ('web_form', 'whatsapp_manual'));

SELECT * FROM sales_orders WHERE ruta = 'whatsapp_manual';
```

---

### **Problema #2: Coordenadas Inexactas**

```
Situación Actual:
┌─────────────────────────────────────┐
│ customer_address: "Jr. Aida..."      │ ← Solo texto
│ customer_lat: -12.046                │ ← Pueden existir
│ customer_lng: -77.037                │ ← O no
│ Problema: Courier puede perderse    │
└─────────────────────────────────────┘

✅ Solución Propuesta:
┌────────────────────────────────────────────────┐
│ customer_address: "Jr. Aida 44, Bellavista"   │
│ url_google_maps: "https://maps.app.goo..."    │
│ latitud: -12.0462 ← Validado y exacto        │
│ longitud: -77.0371 ← Validado y exacto       │
│ referencia_adicional: "Puerta verde..."      │
│ → Courier tiene PIN EXACTO en Google Maps   │
└────────────────────────────────────────────────┘
```

---

### **Problema #3: Sin Asignación de Vendedor**

```
Situación Actual:
• Ruta A: Sistema automático (nadie responsable)
• Ruta B: Vendedor ingresa pero NO se asigna
• Resultado: Pedidos "huérfanos" sin dueño

✅ Solución:
ALTER TABLE sales_orders ADD COLUMN asignado_a_vendedor_id UUID;

UPDATE sales_orders SET asignado_a_vendedor_id = 'uuid-juan'
WHERE order_number = 'SO-2025-001';

En tabla: Juan ve SUS pedidos en /admin/pedidos
         Admin ve TODOS los pedidos
```

---

### **Problema #4: Sin Confirmación Explícita de Cliente**

```
Situación Actual:
├─ Ruta A: Confirma al pagar (implícito)
└─ Ruta B: NO HAY CONFIRMACIÓN
           • Vendedor ingresa
           • Envía WA automático
           • Cliente puede ignorar
           • Courier busca sin confirmación

✅ Solución:
1. ADD campo: estado_confirmacion VARCHAR(50)
2. ADD campo: timestamp_confirmacion_cliente TIMESTAMP
3. ADD campo: timestamp_envio_wa TIMESTAMP

Flujo:
├─ created_at: 14:20 (Pedido ingresado)
├─ timestamp_envio_wa: 14:21 (Mensaje enviado)
├─ timestamp_confirmacion_cliente: 14:28 (Cliente responde "CONFIRMO")
└─ Tiempo respuesta: 7 minutos (KPI importante)
```

---

### **Problema #5: Sin Histórico de Mensajes WhatsApp**

```
Situación Actual:
• No se sabe si mensaje se envió
• No se sabe si cliente recibió
• No se sabe qué dijo cliente
• No hay auditoría

✅ Solución: Crear tabla wa_messages_log

CREATE TABLE wa_messages_log (
  id UUID PRIMARY KEY,
  sales_order_id UUID,
  phone_number VARCHAR(20),
  message_type VARCHAR(50),
  status VARCHAR(50), -- sent, delivered, read, failed
  message_body TEXT,
  timestamp_sent TIMESTAMP,
  timestamp_delivered TIMESTAMP,
  error_message TEXT
);

Ejemplo:
SELECT * FROM wa_messages_log 
WHERE sales_order_id = 'uuid-del-pedido'
ORDER BY timestamp_sent DESC;

Resultado:
│ Tipo: Confirmación  │ Estado: delivered │ 14:21 │
│ Tipo: Respuesta     │ Estado: read      │ 14:28 │
```

---

## ✨ SOLUCIÓN PROPUESTA: 10 Nuevos Campos

| # | Campo | Tipo | Para | Por Qué |
|---|---|---|---|---|
| 1 | `ruta` | TEXT ENUM | Ambas | Diferenciar Ruta A de B |
| 2 | `latitud` | DECIMAL(10,8) | Ruta B | Coordenadas exactas |
| 3 | `longitud` | DECIMAL(11,8) | Ruta B | Coordenadas exactas |
| 4 | `url_google_maps` | VARCHAR(500) | Ruta B | Validar ubicación |
| 5 | `referencia_adicional` | VARCHAR(300) | Ruta B | Info para motorizado |
| 6 | `asignado_a_vendedor_id` | UUID FK | Ruta B | Responsable |
| 7 | `asignado_a_vendedor_nombre` | VARCHAR(100) | Ruta B | Desnormalizado (queries rápidas) |
| 8 | `estado_confirmacion` | VARCHAR(50) | Ruta B | Confirmación cliente |
| 9 | `timestamp_envio_wa` | TIMESTAMP | Ruta B | Auditoría + KPI |
| 10 | `timestamp_confirmacion_cliente` | TIMESTAMP | Ruta B | KPI: tiempo respuesta |

---

## 🗄️ Estructura DESPUÉS de la Migración

```sql
sales_orders (MEJORADA)
├─ CAMPOS EXISTENTES (19):
│  ├─ Identificación: id, order_number
│  ├─ Cliente: name, lastname, phone, district, address, customer_id
│  ├─ Finanzas: total, payment_status, payment_method
│  ├─ Logística: fulfillment_status, tracking, courier
│  ├─ Timestamps: created_at, updated_at, picking_*, packed_at, shipped_at, delivered_at
│  ├─ Metadata: source, recommended_by, priority, customer_type, notes
│  └─ Coords antiguas: customer_lat, customer_lng (DEPRECAR)
│
└─ NUEVOS CAMPOS (10): ← RUTA B
   ├─ `ruta` [web_form | whatsapp_manual]
   ├─ `latitud` (decimal exacto)
   ├─ `longitud` (decimal exacto)
   ├─ `url_google_maps` (validado)
   ├─ `referencia_adicional` (info motorizado)
   ├─ `asignado_a_vendedor_id` (FK → auth.users)
   ├─ `asignado_a_vendedor_nombre` (desnormalizad)
   ├─ `estado_confirmacion` (pendiente/confirmado/rechazado)
   ├─ `timestamp_envio_wa` (cuándo se envió)
   └─ `timestamp_confirmacion_cliente` (cuándo respondió)

TABLAS NUEVAS:
├─ vendedores (id, nombre, email, telefono, is_active)
├─ wa_messages_log (registro de mensajes WA)
└─ plantillas_wa (templates de mensajes)
```

---

## 📈 COMPARATIVA VISUAL

### **ANTES: Solo Ruta A Completa**

```
┌─────────────────────────────────────────┐
│        sales_orders                     │
│  (Optimizado para WEB FORM)             │
├─────────────────────────────────────────┤
│ RUTA A (Web):     100% Funcional ✅    │
│ RUTA B (WhatsApp): 40% Funcional ⚠️    │
│                                         │
│ Falta:                                  │
│ ❌ Diferenciación ruta                 │
│ ❌ Coords exactas (GPS)                │
│ ❌ Asignación vendedor                 │
│ ❌ Confirmación cliente                │
│ ❌ Histórico WA                        │
└─────────────────────────────────────────┘
```

### **DESPUÉS: Ambas Rutas Completas**

```
┌───────────────────────────────────────────────────┐
│           sales_orders (MEJORADA)                 │
│  (Optimizado para WEB FORM + WHATSAPP MANUAL)    │
├───────────────────────────────────────────────────┤
│ RUTA A (Web):     100% Funcional ✅              │
│ RUTA B (WhatsApp): 100% Funcional ✅             │
│                                                   │
│ Nuevas capacidades:                              │
│ ✅ Diferenciación ruta (filtros)                │
│ ✅ Coords exactas (GPS para courier)            │
│ ✅ Asignación vendedor (responsabilidad)        │
│ ✅ Confirmación cliente (prueba)                │
│ ✅ Histórico WA (auditoría)                     │
│ ✅ KPIs medibles (tiempo respuesta)             │
└───────────────────────────────────────────────────┘
```

---

## 🎯 IMPACTO EN FLUJO DE NEGOCIO

### **Ruta A: Sin Cambios (Backward Compatible)**

```
Cliente web → create-sales-order → INSERT sales_orders
{ruta: 'web_form'} → Auto-registra → Mismo flujo actual
```

### **Ruta B: NUEVO Flujo Habilitado**

```
Vendedor en /admin/pedidos/create
    ↓
[Ingresa datos + Google Maps]
    ↓
[Guardar y Enviar Confirmación WA]
    ↓
INSERT sales_orders {ruta: 'whatsapp_manual'} ← NUEVO
    ↓
API WhatsApp → Envía mensaje al cliente ← NUEVO
    ↓
Cliente responde "CONFIRMO" ← NUEVO
    ↓
Webhook procesa respuesta ← NUEVO
    ↓
Estado cambia a PICKING ← AUTOMÁTICO
    ↓
Courier recibe datos + coords exactas ← CRÍTICO
```

---

## 💾 ACCIONES INMEDIATAS

### **1️⃣ Ejecutar SQL (15 minutos)**
```bash
# En Supabase SQL Editor
\i supabase/migrations/20251130_extension_sales_orders_ruta_b.sql
```

### **2️⃣ Verificar Migración (5 minutos)**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sales_orders'
ORDER BY ordinal_position;
```

### **3️⃣ Crear Datos de Prueba (10 minutos)**
```sql
INSERT INTO vendedores (id, nombre, email, telefono) VALUES
('uuid-juan', 'Juan', 'juan@plazamedik.com', '987654321');
```

### **4️⃣ Comenzar Desarrollo Frontend (2 semanas)**
- Hook `usePedidos.ts`
- Componentes React para tabla y formulario
- Integración Google Maps
- Integración WhatsApp

---

## 📊 MATRIZ DE CAMBIOS

```
┌──────────────────┬─────────────────┬──────────────┬────────────┐
│ Componente       │ Tipo            │ Impacto      │ Complejidad│
├──────────────────┼─────────────────┼──────────────┼────────────┤
│ sales_orders     │ ALTER TABLE (10 cols) │ ALTO     │ BAJA      │
│ vendedores       │ CREATE TABLE    │ MEDIO       │ BAJA      │
│ wa_messages_log  │ CREATE TABLE    │ BAJO        │ BAJA      │
│ Hook usePedidos  │ CREATE          │ ALTO        │ MEDIA     │
│ Componentes UI   │ CREATE (12 x)   │ ALTO        │ MEDIA     │
│ Google Maps      │ INTEGRACIÓN     │ ALTO        │ MEDIA     │
│ WhatsApp API     │ INTEGRACIÓN     │ CRÍTICO     │ ALTA      │
│ Migraciones      │ 1 archivo SQL   │ CRÍTICO     │ BAJA      │
└──────────────────┴─────────────────┴──────────────┴────────────┘
```

---

## ✅ CONCLUSIÓN

**La estructura actual de `sales_orders` es BUENA pero INCOMPLETA.**

### ✨ Recomendaciones Finales

| Recomendación | Prioridad | Razón |
|---|---|---|
| Ejecutar migración SQL ahora | 🔴 CRÍTICO | Base de todo lo demás |
| Crear tabla `vendedores` | 🔴 CRÍTICO | Asignación de pedidos |
| Crear tabla `wa_messages_log` | 🟡 ALTA | Auditoría WhatsApp |
| NO crear tabla nueva | ✅ SIGUE | Reutilizar `sales_orders` |
| Mantener backward compatibility | ✅ SIGUE | Ruta A no debe romperse |
| Medir KPIs (tiempo respuesta) | 🟡 ALTA | Mejorar servicio |

---

## 📚 Documentos Relacionados

1. **ANALISIS_ESTRUCTURA_BD_PEDIDOS.md** - Análisis detallado
2. **MAPEO_CAMBIOS_FLUJO_PEDIDOS.md** - Comparativa antes/después
3. **GUIA_IMPLEMENTACION_PANEL_PEDIDOS.md** - Paso a paso
4. **supabase/migrations/20251130_extension_sales_orders_ruta_b.sql** - SQL exacto

---

**Última actualización:** 30-Nov-2025  
**Estado:** Análisis Completo ✅  
**Próximo paso:** Ejecutar migración SQL + Iniciar desarrollo Frontend


# 🔄 MAPEO DE CAMBIOS: Cómo Fluye un Pedido Antes vs. Después

---

## 📊 ESCENARIO 1: RUTA A (Formulario Web) - Flujo Actual

### **Antes (Lo que existe hoy)**

```
USUARIO FINAL
    ↓
 Accede a: /hacer-pedido-wa
    ↓
 Llena formulario:
 ├─ Nombre (Juan Pérez)
 ├─ Teléfono (987654321)
 ├─ Distrito (Miraflores)
 ├─ Producto (Medias 18-22)
 ├─ Color (Piel)
 └─ Precio (S/ 200)
    ↓
 Paga COD (Contra Entrega)
    ↓
 [Confirmar Pedido]
    ↓
 ┌─────────────────────────────────────────┐
 │ create-sales-order Function (Edge Fn)   │
 └─────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────┐
 │ INSERT sales_orders:                    │
 │ • order_number: "SO-2025-001"           │
 │ • customer_name: "Juan"                 │
 │ • customer_phone: "+51987654321"        │
 │ • customer_district: "Miraflores"       │
 │ • customer_address: "" (VACÍO)          │
 │ • total: 200                            │
 │ • fulfillment_status: "UNFULFILLED"     │
 │ • payment_status: "PENDING"             │
 │ • source: "manual" ← (Incorrecto para WA)
 │ • created_at: NOW()                     │
 │ • ruta: (NO EXISTE)                     │
 │ • latitud: (NO EXISTE)                  │
 │ • longitud: (NO EXISTE)                 │
 │ • asignado_a_vendedor: (NO EXISTE)      │
 └─────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────┐
 │ INSERT sales_order_items:               │
 │ • product_code: "750"                   │
 │ • product_name: "Medias 18-22"          │
 │ • quantity: 1                           │
 │ • unit_price: 200                       │
 │ • product_color: "Piel"                 │
 └─────────────────────────────────────────┘
    ↓
 ┌──────────────────────────────────────────────────────────┐
 │ AUTO-TRIGGER: auto_check_stock_and_create_backorder()   │
 ├──────────────────────────────────────────────────────────┤
 │ ¿product_code 750 tiene stock?                           │
 │                                                           │
 │ SÍ → fulfillment_status = "UNFULFILLED"                 │
 │      (Listo para picking)                                │
 │                                                           │
 │ NO → fulfillment_status = "WAITING_STOCK"               │
 │      + INSERT purchase_orders (backorder automático)    │
 │      + INSERT order_state_log (auditoría)               │
 └──────────────────────────────────────────────────────────┘
    ↓
 ✅ PEDIDO CREADO
    ↓
 En /admin/pedidos:
 ├─ Vendedor ve: "Juan - Miraflores - Medias - S/ 200"
 ├─ Estado: "Sin cumplir" (UNFULFILLED) ← Puede iniciar picking
 └─ Acciones: Ver, Editar, Enviar WA, Cancelar

```

### **Limitaciones Actuales (Ruta A)**

| Aspecto | Problema | Impacto |
|---|---|---|
| 🏠 Ubicación | Solo `customer_address` (texto) | Courier puede perderse |
| 📍 Coordenadas | `customer_lat`, `customer_lng` en tabla | Difícil de manejar |
| 👤 Vendedor | NO se asigna | Nadie responsable |
| 🔍 Origen | Campo `source` confuso | No diferencia Ruta A de B |
| 💬 Confirmación WA | Opcional/Manual | No hay prueba de confirmación |

---

## 📊 ESCENARIO 2: RUTA B (Ingreso Manual del Vendedor) - NUEVO FLUJO

### **Después (Lo que implementaremos)**

```
VENDEDOR (en WhatsApp)
    ↓
 [Cliente envía screenshot de producto]
 "Hola, quiero el producto XYZ de 200 soles"
    ↓
 VENDEDOR (en /admin/pedidos)
    ↓
 [+ Nuevo Pedido]
    ↓
 ┌────────────────────────────────────────────┐
 │ PÁGINA: /admin/pedidos/create              │
 ├────────────────────────────────────────────┤
 │ COLUMNA IZQUIERDA:                         │
 │ ┌─ Información Básica ─────────────────┐  │
 │ │ ( ) Web Form                         │  │
 │ │ (✓) Ingreso Manual (WhatsApp) ← OK  │  │
 │ │                                      │  │
 │ │ Teléfono: [+51987654321____________]│  │
 │ │          ↓ (Valida y auto-llena)    │  │
 │ │ Nombre: [Juan Pérez________________]│  │
 │ │ Apellidos: [Pérez__________________]│  │
 │ └─────────────────────────────────────┘  │
 │                                           │
 │ ┌─ Producto(s) ────────────────────────┐  │
 │ │ Buscar: [Media 18-22_____________▼] │  │
 │ │                                      │  │
 │ │ [Medias Compresivas 18-22 - S/ 200] │  │
 │ │ Color: [Piel▼]                       │  │
 │ │ [+ Agregar a carrito]                │  │
 │ │                                      │  │
 │ │ CARRITO:                             │  │
 │ │ │ Producto    │ Precio │ Qty │ Sub  │  │
 │ │ │ Medias 18-22│ 200    │ 1   │ 200  │  │
 │ │ └─────────────────────────────────────┘  │
 │ │ Total: S/ 200                        │  │
 │ │                                      │  │
 │ │ Método Pago: (✓) COD [ ] Yape [ ]   │  │
 │ └─────────────────────────────────────┘  │
 │                                           │
 │ COLUMNA DERECHA:                         │
 │ ┌─ Ubicación ──────────────────────────┐  │
 │ │ Distrito: [Miraflores_____________▼]│  │
 │ │                                      │  │
 │ │ Dirección:                           │  │
 │ │ [Calle Aida Garcia 44, Bellavista__]│  │
 │ │                                      │  │
 │ │ Referencia Adicional:                │  │
 │ │ [Frente al parque, puerta verde____]│  │
 │ └─────────────────────────────────────┘  │
 │                                           │
 │ ┌─ Coordenadas (CRÍTICO) ───────────────┐ │
 │ │                                       │ │
 │ │ Opción A - Pegar Link de Google Maps:│ │
 │ │ [https://maps.app.goo.gl/aBcDe____] │ │
 │ │ [Extraer Coordenadas]                │ │
 │ │                                       │ │
 │ │ ✓ Latitud: -12.0462                 │ │
 │ │ ✓ Longitud: -77.0371                │ │
 │ │ ✓ Dentro de Lima                    │ │
 │ │                                       │ │
 │ │ [Mapa mostrando PIN exacto]          │ │
 │ └───────────────────────────────────────┘ │
 │                                           │
 │ ┌─ Asignación ──────────────────────────┐ │
 │ │ Asignar a: [Juan (Vendedor)_______▼]│ │
 │ │ Guardará automáticamente en BD      │ │
 │ └───────────────────────────────────────┘ │
 └────────────────────────────────────────────┘
    ↓
 [Guardar y Enviar Confirmación WA]
    ↓
 ┌─────────────────────────────────────────────────┐
 │ VALIDACIONES ANTES DE ENVIAR:                   │
 │ ✓ Teléfono completo                            │
 │ ✓ Nombre del cliente                           │
 │ ✓ Producto(s) seleccionado(s)                  │
 │ ✓ Dirección con coordenadas GPS                │
 │ → ¡TODAS PASAN! Proceder...                   │
 └─────────────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────────────┐
 │ ACCIÓN 1: GUARDAR EN BD                        │
 └─────────────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────────────┐
 │ INSERT sales_orders:                            │
 │ • order_number: "SO-2025-1234" ← Auto          │
 │ • ruta: "whatsapp_manual" ← ¡NUEVO!            │
 │ • customer_name: "Juan"                        │
 │ • customer_phone: "+51987654321"               │
 │ • customer_district: "Miraflores"              │
 │ • customer_address: "Calle Aida Garcia 44"     │
 │ • latitud: -12.0462 ← ¡NUEVO!                 │
 │ • longitud: -77.0371 ← ¡NUEVO!                │
 │ • url_google_maps: "https://maps.app.goo.gl..." │
 │ • referencia_adicional: "Frente al parque..." ← ¡NUEVO!
 │ • asignado_a_vendedor_id: "uuid-juan" ← ¡NUEVO!
 │ • asignado_a_vendedor_nombre: "Juan" ← ¡NUEVO!
 │ • total: 200                                   │
 │ • fulfillment_status: "UNFULFILLED"            │
 │ • payment_status: "PENDING"                    │
 │ • estado_confirmacion: "pendiente" ← ¡NUEVO!  │
 │ • created_at: NOW()                            │
 └─────────────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────────────┐
 │ INSERT sales_order_items (mismo que antes)     │
 │ • product_code, product_name, quantity, etc    │
 └─────────────────────────────────────────────────┘
    ↓
 ┌──────────────────────────────────────────────────┐
 │ AUTO-TRIGGER: auto_check_stock_and_create_...  │
 │ (Mismo lógica que Ruta A)                       │
 └──────────────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────────────┐
 │ ACCIÓN 2: ENVIAR MENSAJE WhatsApp (API)        │
 └─────────────────────────────────────────────────┘
    ↓
 ┌─────────────────────────────────────────────────┐
 │ supabase.functions.invoke('send-wa-message')   │
 │ {                                               │
 │   phone: "+51987654321",                        │
 │   template: "confirmacion_pedido_whatsapp",    │
 │   variables: {                                  │
 │     nombre_cliente: "Juan",                    │
 │     codigo_pedido: "SO-2025-1234",             │
 │     nombre_producto: "Medias 18-22",           │
 │     precio: "200",                             │
 │     direccion: "Calle Aida Garcia 44",         │
 │     descuento: "Gratis bolsita"                │
 │   }                                             │
 │ }                                               │
 └─────────────────────────────────────────────────┘
    ↓
 📱 CLIENTE RECIBE (en WhatsApp):
 ┌─────────────────────────────────────┐
 │ ¡Hola Juan 👋                       │
 │                                     │
 │ Recibimos tu pedido SO-2025-1234    │
 │                                     │
 │ 📦 Producto: Medias 18-22 mmHg      │
 │ 💰 Precio: S/ 200                   │
 │ 📍 Destino: Calle Aida Garcia 44    │
 │              (Ubicación confirmada ✅) │
 │                                     │
 │ ⏱️ Entrega: Mañana 9am-5pm          │
 │                                     │
 │ Para autorizar responde:            │
 │ 👉 CONFIRMO                         │
 │                                     │
 │ Gracias por confiar 🏥             │
 └─────────────────────────────────────┘
    ↓
 ┌────────────────────────────────────────────────┐
 │ INSERT wa_messages_log:                        │
 │ • sales_order_id: "uuid-del-pedido"           │
 │ • phone_number: "+51987654321"                │
 │ • status: "sent" ← ¡Enviado!                  │
 │ • timestamp_sent: NOW()                       │
 │ • wa_message_id: "wamid.xxxxx"                │
 └────────────────────────────────────────────────┘
    ↓
 ✅ EN /admin/pedidos:
    ├─ Vendedor ve: "Juan - Miraflores - Medias - S/ 200"
    ├─ Estado Confirmación: "Pendiente" (amarillo) ← ¡NUEVO!
    ├─ Timestamp: "Enviado hace 2 minutos"
    ├─ Coordenadas: "12.0462, -77.0371" (pin en mapa)
    ├─ Asignado a: "Juan" (vendedor)
    └─ Acciones: Ver detalles, Cambiar vendedor, Reenviar WA
    ↓
 ⏳ ESPERANDO RESPUESTA CLIENTE (Webhook)
    ↓
 CLIENTE RESPONDE EN WhatsApp: "CONFIRMO"
    ↓
 ┌────────────────────────────────────────────────┐
 │ Webhook: on-wa-customer-response               │
 │ {                                              │
 │   phone: "+51987654321",                       │
 │   message: "CONFIRMO",                         │
 │   timestamp: "2025-11-30T14:35:00Z"           │
 │ }                                              │
 └────────────────────────────────────────────────┘
    ↓
 ┌────────────────────────────────────────────────┐
 │ UPDATE sales_orders:                           │
 │ • estado_confirmacion = "confirmado_cliente"   │
 │ • timestamp_confirmacion_cliente = NOW()       │
 │ • fulfillment_status = "PICKING" ← ¡Cambio!   │
 └────────────────────────────────────────────────┘
    ↓
 ✅ EN /admin/pedidos:
    ├─ Estado Confirmación: "Confirmado ✅" (verde)
    ├─ Estado Logística: "Picking en proceso"
    ├─ Tiempo respuesta: "8 minutos"
    └─ Botón: "Generar Etiqueta Courier"
    ↓
 🚚 COURIER RECOGE Y ENTREGA
 ↓
 (Mismo flujo que Ruta A a partir de aquí)

```

---

## 🔍 COMPARACIÓN: RUTA A vs. RUTA B

### **Tabla Comparativa**

| Aspecto | RUTA A (Web) | RUTA B (WhatsApp) |
|---|---|---|
| **Origen** | Cliente llena web | Vendedor ingresa manual |
| **Flujo** | Automático | Semi-automático |
| **Ruta BD** | `ruta = 'web_form'` | `ruta = 'whatsapp_manual'` |
| **Ubicación** | String (`customer_address`) | GPS exactas (`latitud`, `longitud`) |
| **Asignado a** | Sistema automático | Vendedor específico |
| **Confirmación** | Implícita (pago) | Explícita ("CONFIRMO") |
| **Validación WA** | Opcional | Obligatoria |
| **Timestamps** | `created_at`, `delivered_at` | + `timestamp_envio_wa`, `timestamp_confirmacion_cliente` |
| **Estado Confirmación** | N/A | `estado_confirmacion` (pendiente/confirmado/rechazado) |

---

## 📈 IMPACTO EN TABLA `sales_orders`

### **Antes**
```
Campos utilizados:       11 (de 25)
Datos de Ruta B:         0%
Coordenadas exactas:     60% (algunos clientes)
Asignación vendedor:     0%
```

### **Después**
```
Campos utilizados:       22 (de 25)
Datos de Ruta B:         100%
Coordenadas exactas:     100% (obligatorio)
Asignación vendedor:     100%
```

---

## 🎯 RESUMEN DE CAMBIOS CLAVE

| # | Campo | Tabla | Antes | Después | Notas |
|---|---|---|---|---|---|
| 1 | `ruta` | sales_orders | ❌ NO | ✅ SÍ | Diferencia Ruta A de B |
| 2 | `latitud` | sales_orders | ⚠️ customer_lat | ✅ Renombrado/Unificado | Coordenadas exactas |
| 3 | `longitud` | sales_orders | ⚠️ customer_lng | ✅ Renombrado/Unificado | Coordenadas exactas |
| 4 | `url_google_maps` | sales_orders | ❌ NO | ✅ SÍ | Validación de ubicación |
| 5 | `referencia_adicional` | sales_orders | ❌ NO | ✅ SÍ | Info para motorizado |
| 6 | `asignado_a_vendedor_id` | sales_orders | ❌ NO | ✅ SÍ | Responsable del pedido |
| 7 | `estado_confirmacion` | sales_orders | ❌ NO | ✅ SÍ | Confirmación cliente |
| 8 | `timestamp_envio_wa` | sales_orders | ❌ NO | ✅ SÍ | Auditoría |
| 9 | `timestamp_confirmacion_cliente` | sales_orders | ❌ NO | ✅ SÍ | KPI: tiempo respuesta |
| 10 | `vendedores` | (tabla nueva) | ❌ NO | ✅ NUEVA | Maestro de vendedores |
| 11 | `wa_messages_log` | (tabla nueva) | ❌ NO | ✅ NUEVA | Histórico de WA |


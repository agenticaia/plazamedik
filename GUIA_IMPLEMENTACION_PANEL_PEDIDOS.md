# 🚀 GUÍA DE IMPLEMENTACIÓN: Panel de Gestión de Pedidos Ruta B

---

## 📋 Checklist de Implementación

### **FASE 1: Base de Datos (CRÍTICO PRIMERO)**

- [ ] **1.1** Ejecutar migración SQL en Supabase
  - Archivo: `/workspaces/plazamedik/supabase/migrations/20251130_extension_sales_orders_ruta_b.sql`
  - En: Supabase Dashboard → SQL Editor
  - Valida que todas las columnas se agreguen sin errores

- [ ] **1.2** Verificar índices creados
  ```sql
  SELECT * FROM pg_indexes 
  WHERE tablename = 'sales_orders' 
  ORDER BY indexname;
  ```

- [ ] **1.3** Crear datos de prueba en tabla `vendedores`
  ```sql
  INSERT INTO vendedores (id, nombre, email, telefono, is_active) VALUES
  ('UUID-DE-JUAN', 'Juan', 'juan@plazamedik.com', '987654321', TRUE),
  ('UUID-DE-MARIA', 'María', 'maria@plazamedik.com', '987654322', TRUE);
  ```

- [ ] **1.4** Verificar estructura
  ```sql
  \d sales_orders  -- En psql o Supabase SQL Editor
  ```

---

### **FASE 2: Backend - Hooks y Servicios**

- [ ] **2.1** Crear/Actualizar hook `usePedidos.ts`
  - Ubicación: `/workspaces/plazamedik/src/hooks/usePedidos.ts`
  - Funcionalidad:
    - `getPedidos()` - Listar con filtros (ruta, estado, vendedor)
    - `createPedido()` - Crear nuevo
    - `updatePedido()` - Actualizar estado
    - `deletePedido()` - Cancelar
    - `asignarVendedor()` - Asignar a vendedor

- [ ] **2.2** Crear servicio de Google Maps
  - Ubicación: `/workspaces/plazamedik/src/services/mapsService.ts`
  - Funcionalidad:
    - `extractCoordsFromURL()` - Parsear link de Google Maps
    - `validateCoordinates()` - Verificar que esté en Lima
    - `validateAddress()` - Validar dirección

- [ ] **2.3** Crear servicio de WhatsApp
  - Ubicación: `/workspaces/plazamedik/src/services/whatsappService.ts`
  - Funcionalidad:
    - `sendConfirmationMessage()` - Enviar mensaje con template
    - `logMessage()` - Registrar en BD
    - `parseWebhookResponse()` - Procesar respuesta cliente

- [ ] **2.4** Crear tipos TypeScript
  - Ubicación: `/workspaces/plazamedik/src/types/pedidos.ts`
  - Interfaces:
    - `Pedido` (coincida con sales_orders)
    - `PedidoFiltros`
    - `PedidoFormData`
    - `MensajeWA`

---

### **FASE 3: Componentes React**

#### **3.1 - Tabla Maestra (REQUERIMIENTO 1)**

- [ ] **Crear `/admin/pedidos/tabla/PedidosTable.tsx`**
  - Estructura: 11 columnas (ver Requerimiento 1)
  - Características:
    - [ ] Filtros (Estado, Ruta, Vendedor, Fecha)
    - [ ] Búsqueda por teléfono/código
    - [ ] Paginación (20 items/página)
    - [ ] Expansible en mobile
    - [ ] Columna acciones (Ver, Editar, WA, Cancelar)
    - [ ] Alertas (pedidos sin asignar >2h, bajo stock)

- [ ] **Crear `/admin/pedidos/tabla/PedidoFilters.tsx`**
  - Dropdowns para Estado, Ruta, Vendedor, Fecha
  - Botones: "Nuevo Pedido", "Descargar Excel"

- [ ] **Crear `/admin/pedidos/tabla/PedidoRow.tsx`**
  - Fila individual con todos los campos
  - Estado expandible para mobile

#### **3.2 - Formulario Crear/Editar (REQUERIMIENTO 2)**

- [ ] **Crear `/admin/pedidos/form/PedidoForm.tsx`**
  - Layout 2 columnas (izquierda: cliente/producto, derecha: ubicación)
  - Validaciones antes de guardar

- [ ] **Crear `/admin/pedidos/form/PedidoFormCliente.tsx`**
  - Teléfono con auto-búsqueda de cliente
  - Nombre, apellido, distrito
  - Método de pago

- [ ] **Crear `/admin/pedidos/form/PedidoFormProductos.tsx`**
  - Buscador de productos
  - Selector de color
  - Carrito de compras mini
  - Totales

- [ ] **Crear `/admin/pedidos/form/PedidoFormUbicacion.tsx`** (CRÍTICO)
  - Input para pegar link Google Maps
  - Validación de coordenadas
  - Mapa embed mostrando pin exacto
  - Input alternativo para lat/long manual
  - Validación que esté en Lima

- [ ] **Crear `/admin/pedidos/form/PedidoFormAcciones.tsx`**
  - Botón: "Guardar Borrador"
  - Botón: "Guardar y Enviar WA" (Verde, primario)
  - Botón: "Cancelar"
  - Modal de confirmación antes de enviar

#### **3.3 - Componentes Auxiliares**

- [ ] **Crear `/admin/pedidos/modals/PedidoStateModal.tsx`**
  - Cambiar estado (dropdown)
  - Cambiar asignado a (dropdown)
  - Validaciones de transición

- [ ] **Crear `/admin/pedidos/detalle/PedidoDetalle.tsx`**
  - Vista expandida del pedido
  - Timeline de cambios (order_state_log)
  - Histórico de mensajes WA (wa_messages_log)
  - Botones para resend WA, cambiar estado, etc.

- [ ] **Crear `/admin/pedidos/mapa/MapaUbicacion.tsx`**
  - Mostrar mapa con coordenadas
  - Integración Google Maps o Leaflet
  - Reutilizable en formulario y detalle

#### **3.4 - Alertas y Widgets**

- [ ] **Crear `/admin/pedidos/widgets/AlertasPedidos.tsx`**
  - Mostrar alertas de pedidos sin asignar >2h
  - Mostrar alertas de bajo stock

- [ ] **Crear `/admin/pedidos/widgets/KPIsPedidos.tsx`**
  - Cards mostrando:
    - Total pedidos hoy
    - Pedidos confirmados/rechazados
    - Tiempo promedio respuesta cliente
    - Tiempo promedio entrega

---

### **FASE 4: Páginas Principales**

- [ ] **4.1** Actualizar `/admin/pedidos/index.tsx`
  - Mostrar tabla maestra con todos los filtros
  - Usar `PedidosTable`, `PedidoFilters`, `AlertasPedidos`, `KPIsPedidos`

- [ ] **4.2** Crear `/admin/pedidos/create.tsx`
  - Formulario vacío para nuevo pedido (Ruta B)
  - Usar `PedidoForm`
  - Ruta: `/admin/pedidos/create`

- [ ] **4.3** Crear `/admin/pedidos/[id]/edit.tsx`
  - Formulario pre-llenado para editar pedido
  - Usar `PedidoForm`
  - Ruta: `/admin/pedidos/SO-2025-1234/edit`

---

### **FASE 5: Integración Google Maps**

- [ ] **5.1** Configurar API Key
  - En `.env.local`: `VITE_GOOGLE_MAPS_API_KEY=xxxxx`
  - En `vite.config.ts`: Asegurarse de que la variable esté disponible

- [ ] **5.2** Instalar dependencia (si aún no existe)
  ```bash
  npm install @googlemaps/js-api-loader
  ```

- [ ] **5.3** Crear utilidad para parsear URLs
  ```typescript
  // lib/mapsUtils.ts
  export const parseGoogleMapsURL = (url: string): {lat: number, lng: number} | null
  export const validateLimaCoordinates = (lat: number, lng: number): boolean
  export const embedMapIframe = (lat: number, lng: number): string
  ```

---

### **FASE 6: Integración WhatsApp Business API**

- [ ] **6.1** Crear Edge Function `send-wa-message`
  - Ubicación: `/workspaces/plazamedik/supabase/functions/send-wa-message/`
  - Recibe: phone, template, variables
  - Envía: Mensaje vía WhatsApp Business API
  - Registra: En tabla `wa_messages_log`

- [ ] **6.2** Crear Webhook para recibir respuestas
  - Ubicación: `/workspaces/plazamedik/supabase/functions/on-wa-customer-response/`
  - Escucha: Respuestas de clientes en WhatsApp
  - Actualiza: `estado_confirmacion`, `timestamp_confirmacion_cliente`
  - Dispara: Cambio de estado a PICKING

- [ ] **6.3** Configurar credenciales
  - `.env.local`:
    - `VITE_WHATSAPP_PHONE_NUMBER_ID=xxxxx`
    - `VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx`
    - `VITE_WHATSAPP_API_VERSION=xxxxx`

---

### **FASE 7: Testing & Validación**

- [ ] **7.1** Testing Manual - Ruta A (Existente)
  - [ ] Crear pedido vía `/hacer-pedido-wa`
  - [ ] Ver en `/admin/pedidos` con `ruta = 'web_form'`
  - [ ] Verificar que trigger auto-crea backorder si no hay stock

- [ ] **7.2** Testing Manual - Ruta B (Nuevo)
  - [ ] Acceder a `/admin/pedidos/create`
  - [ ] Ingresar datos cliente
  - [ ] Ingresar link Google Maps
  - [ ] Validar extracción de coords
  - [ ] Asignar vendedor
  - [ ] [Guardar y Enviar Confirmación WA]
  - [ ] Verificar que llegó mensaje WhatsApp
  - [ ] Responder "CONFIRMO" en WhatsApp
  - [ ] Verificar que estado cambió en BD

- [ ] **7.3** Testing Filtros
  - [ ] Filtrar por Ruta A y B
  - [ ] Filtrar por estado
  - [ ] Filtrar por vendedor
  - [ ] Buscar por teléfono

- [ ] **7.4** Testing Edge Cases
  - [ ] Google Maps URL inválida → error
  - [ ] Coordenadas fuera de Lima → alerta
  - [ ] Teléfono duplicado → búsqueda existente
  - [ ] Sin producto seleccionado → validar y mostrar error
  - [ ] Vendedor no asignado → indicador rojo
  - [ ] Cliente rechaza pedido → estado "rechazado"

---

### **FASE 8: Documentación y Capacitación**

- [ ] **8.1** Actualizar README con:
  - Explicación de Ruta A vs Ruta B
  - Cómo crear pedido desde WhatsApp (Ruta B)
  - Campos nuevos en DB

- [ ] **8.2** Crear guía para vendedores:
  - Documento: `/docs/GUIA_INGRESO_PEDIDOS_RUTA_B.md`
  - Paso a paso con screenshots
  - Qué hacer si Google Maps no funciona
  - Cómo responder "CONFIRMO" del cliente

- [ ] **8.3** Crear guía de troubleshooting:
  - Documento: `/docs/TROUBLESHOOTING_PEDIDOS.md`
  - Problemas comunes y soluciones

---

## 🛠️ ORDEN DE DESARROLLO RECOMENDADO

```
SEMANA 1:
├─ Lunes: Fase 1 (DB) + Fase 2 (Servicios)
├─ Martes: Fase 3.1 (Tabla)
├─ Miércoles: Fase 3.2 (Formulario)
├─ Jueves: Fase 5 (Google Maps)
└─ Viernes: Testing básico

SEMANA 2:
├─ Lunes: Fase 6 (WhatsApp)
├─ Martes-Miércoles: Testing completo
├─ Jueves: Fixes y ajustes
└─ Viernes: Documentación + Capacitación
```

---

## 💾 ARCHIVOS A CREAR/MODIFICAR

### **Crear Nuevos:**
```
src/
├─ hooks/usePedidos.ts ← NUEVO
├─ services/
│  ├─ mapsService.ts ← NUEVO
│  ├─ whatsappService.ts ← NUEVO
│  └─ pedidosService.ts ← NUEVO
├─ types/pedidos.ts ← NUEVO
├─ lib/mapsUtils.ts ← NUEVO
├─ components/admin/pedidos/
│  ├─ tabla/
│  │  ├─ PedidosTable.tsx ← NUEVO
│  │  ├─ PedidoFilters.tsx ← NUEVO
│  │  └─ PedidoRow.tsx ← NUEVO
│  ├─ form/
│  │  ├─ PedidoForm.tsx ← NUEVO
│  │  ├─ PedidoFormCliente.tsx ← NUEVO
│  │  ├─ PedidoFormProductos.tsx ← NUEVO
│  │  ├─ PedidoFormUbicacion.tsx ← NUEVO
│  │  └─ PedidoFormAcciones.tsx ← NUEVO
│  ├─ modals/
│  │  └─ PedidoStateModal.tsx ← NUEVO
│  ├─ detalle/
│  │  └─ PedidoDetalle.tsx ← NUEVO
│  ├─ mapa/
│  │  └─ MapaUbicacion.tsx ← NUEVO
│  └─ widgets/
│     ├─ AlertasPedidos.tsx ← NUEVO
│     └─ KPIsPedidos.tsx ← NUEVO
├─ pages/admin/pedidos/
│  ├─ create.tsx ← NUEVO
│  └─ [id]/edit.tsx ← NUEVO
└─ docs/
   ├─ GUIA_INGRESO_PEDIDOS_RUTA_B.md ← NUEVO
   └─ TROUBLESHOOTING_PEDIDOS.md ← NUEVO

supabase/
├─ migrations/
│  └─ 20251130_extension_sales_orders_ruta_b.sql ← NUEVO
└─ functions/
   ├─ send-wa-message/ ← NUEVO
   └─ on-wa-customer-response/ ← NUEVO
```

### **Modificar Existentes:**
```
src/
├─ pages/admin/Pedidos.tsx ← ACTUALIZAR (agregar tabla nueva)
└─ integrations/supabase/types.ts ← ACTUALIZAR (tipos de sales_orders)
```

---

## 🎯 ENTREGABLES POR FASE

| Fase | Entregable | Status | Fecha |
|---|---|---|---|
| 1 | Migración SQL ejecutada | ⏳ | DD/MM |
| 2 | Hooks + Servicios | ⏳ | DD/MM |
| 3 | Componentes UI | ⏳ | DD/MM |
| 4 | Páginas principales | ⏳ | DD/MM |
| 5 | Google Maps integrado | ⏳ | DD/MM |
| 6 | WhatsApp Business integrado | ⏳ | DD/MM |
| 7 | Testing completo | ⏳ | DD/MM |
| 8 | Documentación + Capacitación | ⏳ | DD/MM |

---

## 📞 CONTACTO & SOPORTE

**En caso de dudas:**
- [ ] Revisar documentos:
  - `ANALISIS_ESTRUCTURA_BD_PEDIDOS.md`
  - `MAPEO_CAMBIOS_FLUJO_PEDIDOS.md`
  - `supabase/migrations/20251130_extension_sales_orders_ruta_b.sql`

- [ ] Testing:
  - Ejecutar queries en Supabase SQL Editor
  - Verificar logs de Edge Functions
  - Revisar console del navegador


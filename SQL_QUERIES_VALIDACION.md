# 🔍 QUERIES SQL para Validación y Debugging

---

## ✅ Validar que la Migración se Ejecutó Correctamente

### **1. Verificar que todas las columnas nuevas existen**

```sql
-- Listar todas las columnas de sales_orders
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sales_orders'
ORDER BY ordinal_position;

-- Debería mostrar:
-- ruta, latitud, longitud, url_google_maps, referencia_adicional,
-- asignado_a_vendedor_id, asignado_a_vendedor_nombre, 
-- estado_confirmacion, timestamp_envio_wa, timestamp_confirmacion_cliente, comprobante_prepago
```

---

### **2. Verificar que los índices se crearon**

```sql
-- Listar índices de sales_orders
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'sales_orders'
ORDER BY indexname;

-- Debería mostrar:
-- idx_sales_orders_ruta
-- idx_sales_orders_vendedor
-- idx_sales_orders_coords
-- idx_sales_orders_estado_confirmacion
-- idx_sales_orders_timestamp_registro_desc
```

---

### **3. Verificar que la tabla vendedores existe**

```sql
-- Verificar estructura de tabla vendedores
\d vendedores;

-- O:
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vendedores'
ORDER BY ordinal_position;
```

---

### **4. Verificar que la vista v_pedidos_whatsapp_manual existe**

```sql
-- Listar todas las vistas
SELECT * FROM information_schema.views 
WHERE table_name LIKE '%pedidos%';

-- Debería mostrar: v_pedidos_whatsapp_manual
```

---

## 📊 QUERIES DE ANÁLISIS

### **5. Contar pedidos por Ruta (para validar migración)**

```sql
-- Contar pedidos por ruta
SELECT 
  ruta,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM sales_orders
GROUP BY ruta;

-- Resultado esperado:
-- ruta         | total | porcentaje
-- web_form     | 150   | 75%
-- whatsapp_manual| 50  | 25%
-- (Depende de tus datos reales)
```

---

### **6. Ver pedidos sin asignar (Ruta B)**

```sql
-- Identificar pedidos Ruta B sin asignar
SELECT 
  order_number,
  customer_name,
  customer_phone,
  created_at,
  estado_confirmacion,
  asignado_a_vendedor_nombre
FROM sales_orders
WHERE ruta = 'whatsapp_manual' 
  AND asignado_a_vendedor_id IS NULL
ORDER BY created_at DESC;

-- Estos pedidos necesitan asignación inmediata
```

---

### **7. Ver pedidos pendientes de confirmación (Ruta B)**

```sql
-- Pedidos que aún no confirmó el cliente
SELECT 
  order_number,
  customer_name,
  customer_phone,
  asignado_a_vendedor_nombre,
  timestamp_envio_wa,
  EXTRACT(MINUTE FROM (NOW() - timestamp_envio_wa)) as minutos_desde_envio,
  estado_confirmacion
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND estado_confirmacion = 'pendiente'
  AND timestamp_envio_wa IS NOT NULL
ORDER BY timestamp_envio_wa ASC;

-- Estos pedidos requieren seguimiento
```

---

### **8. Ver historial de mensajes WhatsApp para un pedido**

```sql
-- Reemplazar 'uuid-del-pedido' con el UUID real
SELECT 
  message_type,
  status,
  timestamp_sent,
  timestamp_delivered,
  message_body,
  error_message
FROM wa_messages_log
WHERE sales_order_id = 'uuid-del-pedido'
ORDER BY timestamp_sent DESC;
```

---

### **9. Calcular KPI: Tiempo promedio de respuesta del cliente**

```sql
-- KPI: ¿Cuánto tardan los clientes en responder "CONFIRMO"?
SELECT 
  ROUND(AVG(EXTRACT(EPOCH FROM (timestamp_confirmacion_cliente - created_at)) / 60), 2) as tiempo_promedio_minutos,
  MIN(EXTRACT(EPOCH FROM (timestamp_confirmacion_cliente - created_at)) / 60) as tiempo_minimo_minutos,
  MAX(EXTRACT(EPOCH FROM (timestamp_confirmacion_cliente - created_at)) / 60) as tiempo_maximo_minutos,
  COUNT(*) as total_confirmados
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND estado_confirmacion = 'confirmado_cliente'
  AND timestamp_confirmacion_cliente IS NOT NULL;

-- Resultado esperado:
-- tiempo_promedio: 12.5 minutos
-- tiempo_minimo: 2 minutos
-- tiempo_maximo: 45 minutos
-- total_confirmados: 35
```

---

### **10. Calcular KPI: Tasa de confirmación**

```sql
-- ¿Qué porcentaje de pedidos confirma el cliente?
SELECT 
  COUNT(CASE WHEN estado_confirmacion = 'confirmado_cliente' THEN 1 END) as confirmados,
  COUNT(CASE WHEN estado_confirmacion = 'rechazado' THEN 1 END) as rechazados,
  COUNT(CASE WHEN estado_confirmacion = 'pendiente' THEN 1 END) as pendientes,
  COUNT(*) as total_ruta_b,
  ROUND(100.0 * COUNT(CASE WHEN estado_confirmacion = 'confirmado_cliente' THEN 1 END) 
    / NULLIF(COUNT(CASE WHEN estado_confirmacion != 'pendiente' THEN 1 END), 0), 2) as tasa_confirmacion_pct
FROM sales_orders
WHERE ruta = 'whatsapp_manual';

-- Resultado esperado:
-- confirmados | rechazados | pendientes | total | tasa_confirmacion
-- 35          | 2          | 8          | 45    | 94.59%
```

---

### **11. Ver pedidos por vendedor asignado**

```sql
-- Contar pedidos por vendedor
SELECT 
  asignado_a_vendedor_nombre as vendedor,
  COUNT(*) as total_pedidos,
  COUNT(CASE WHEN fulfillment_status = 'DELIVERED' THEN 1 END) as entregados,
  COUNT(CASE WHEN estado_confirmacion = 'confirmado_cliente' THEN 1 END) as confirmados,
  ROUND(100.0 * COUNT(CASE WHEN fulfillment_status = 'DELIVERED' THEN 1 END) / COUNT(*), 2) as tasa_entrega_pct
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
GROUP BY asignado_a_vendedor_nombre
ORDER BY total_pedidos DESC;

-- Resultado esperado:
-- vendedor | total | entregados | confirmados | tasa_entrega
-- Juan     | 25    | 20         | 24          | 80%
-- María    | 20    | 15         | 19          | 75%
```

---

### **12. Validar coordenadas GPS (pedidos con coords)**

```sql
-- Ver todos los pedidos con coordenadas
SELECT 
  order_number,
  customer_name,
  customer_district,
  latitud,
  longitud,
  url_google_maps,
  CASE 
    WHEN latitud BETWEEN -12.3 AND -11.7 AND longitud BETWEEN -77.3 AND -76.8 
    THEN 'En Lima ✅'
    ELSE 'Fuera de Lima ⚠️'
  END as validacion_ubicacion
FROM sales_orders
WHERE latitud IS NOT NULL AND longitud IS NOT NULL
ORDER BY created_at DESC;
```

---

### **13. Ver pedidos sin coordenadas (requieren atención)**

```sql
-- Pedidos que no tienen coords exactas
SELECT 
  order_number,
  customer_name,
  customer_address,
  url_google_maps,
  asignado_a_vendedor_nombre,
  estado_confirmacion
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND (latitud IS NULL OR longitud IS NULL)
ORDER BY created_at DESC;

-- Estos requieren que el vendedor agregue coords
```

---

### **14. Dashboard en tiempo real - Resumen Ruta B**

```sql
-- Vista rápida del estado actual
SELECT 
  'Total Pedidos Ruta B' as metrica, 
  COUNT(*) as valor
FROM sales_orders
WHERE ruta = 'whatsapp_manual'

UNION ALL

SELECT 'Pendiente Confirmación', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND estado_confirmacion = 'pendiente'

UNION ALL

SELECT 'Confirmados por Cliente', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND estado_confirmacion = 'confirmado_cliente'

UNION ALL

SELECT 'Rechazados', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND estado_confirmacion = 'rechazado'

UNION ALL

SELECT 'Sin Asignar a Vendedor', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND asignado_a_vendedor_id IS NULL

UNION ALL

SELECT 'Con Coords GPS', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND latitud IS NOT NULL AND longitud IS NOT NULL

UNION ALL

SELECT 'En Ruta', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND fulfillment_status IN ('PICKING', 'PACKED', 'SHIPPED')

UNION ALL

SELECT 'Entregados', 
  COUNT(*) 
FROM sales_orders
WHERE ruta = 'whatsapp_manual' AND fulfillment_status = 'DELIVERED'

ORDER BY valor DESC;
```

---

## 🔧 QUERIES DE MANTENIMIENTO

### **15. Actualizar vendedor asignado**

```sql
-- Reasignar pedido a otro vendedor
UPDATE sales_orders
SET 
  asignado_a_vendedor_id = 'uuid-nuevo-vendedor',
  asignado_a_vendedor_nombre = 'Nombre Nuevo',
  updated_at = NOW()
WHERE order_number = 'SO-2025-001234';
```

---

### **16. Marcar pedido como confirmado manualmente**

```sql
-- Si el cliente confirma por teléfono (no por WhatsApp)
UPDATE sales_orders
SET 
  estado_confirmacion = 'confirmado_cliente',
  timestamp_confirmacion_cliente = NOW(),
  fulfillment_status = 'PICKING',
  updated_at = NOW()
WHERE order_number = 'SO-2025-001234';
```

---

### **17. Registrar mensaje WA enviado**

```sql
-- Registrar manualmente un envío de mensaje
INSERT INTO wa_messages_log (
  sales_order_id,
  phone_number,
  message_type,
  status,
  message_body,
  wa_message_id,
  timestamp_sent
) VALUES (
  'uuid-del-pedido',
  '+51987654321',
  'confirmacion_pedido',
  'sent',
  'Mensaje de confirmación...',
  'wamid.xxxxxxxxxxxxxx',
  NOW()
);
```

---

### **18. Limpiar pedidos de prueba**

```sql
-- Eliminar pedidos de prueba (usar con cuidado!)
DELETE FROM sales_orders
WHERE order_number LIKE 'TEST-%'
  AND created_at > NOW() - INTERVAL '1 day';
```

---

## 📈 QUERIES PARA REPORTES

### **19. Reporte Diario - Ruta B**

```sql
-- Resumen del día
SELECT 
  DATE_TRUNC('day', created_at)::DATE as fecha,
  COUNT(*) as total_pedidos,
  COUNT(CASE WHEN estado_confirmacion = 'confirmado_cliente' THEN 1 END) as confirmados,
  COUNT(CASE WHEN fulfillment_status = 'DELIVERED' THEN 1 END) as entregados,
  ROUND(SUM(total), 2) as monto_total,
  ROUND(AVG(total), 2) as ticket_promedio
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND created_at >= DATE_TRUNC('day', NOW())
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY fecha DESC;
```

---

### **20. Reporte Mensual - Comparativa Rutas**

```sql
-- Comparar rendimiento Ruta A vs B
SELECT 
  ruta,
  COUNT(*) as total_pedidos,
  ROUND(SUM(total), 2) as monto_total,
  ROUND(AVG(total), 2) as ticket_promedio,
  COUNT(CASE WHEN fulfillment_status = 'DELIVERED' THEN 1 END) as entregados,
  ROUND(100.0 * COUNT(CASE WHEN fulfillment_status = 'DELIVERED' THEN 1 END) 
    / COUNT(*), 2) as tasa_entrega_pct
FROM sales_orders
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY ruta
ORDER BY ruta;
```

---

## ⚠️ QUERIES PARA ALERTAS

### **21. Alertar: Pedidos sin asignar hace más de 2 horas**

```sql
-- Pedidos Ruta B sin asignar > 2 horas (alerta para admin)
SELECT 
  order_number,
  customer_name,
  customer_phone,
  created_at,
  EXTRACT(MINUTE FROM (NOW() - created_at)) as minutos_sin_asignar
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND asignado_a_vendedor_id IS NULL
  AND created_at < NOW() - INTERVAL '2 hours'
ORDER BY created_at ASC;
```

---

### **22. Alertar: Pedidos esperando respuesta cliente >30 min**

```sql
-- Clientes que no responden después de 30 minutos
SELECT 
  order_number,
  customer_name,
  customer_phone,
  asignado_a_vendedor_nombre,
  timestamp_envio_wa,
  EXTRACT(MINUTE FROM (NOW() - timestamp_envio_wa)) as minutos_esperando
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND estado_confirmacion = 'pendiente'
  AND timestamp_envio_wa < NOW() - INTERVAL '30 minutes'
ORDER BY timestamp_envio_wa ASC;

-- → El vendedor debe enviar recordatorio al cliente
```

---

### **23. Alertar: Pedidos sin coordenadas GPS**

```sql
-- Pedidos en proceso sin coordenadas exactas
SELECT 
  order_number,
  customer_name,
  customer_address,
  asignado_a_vendedor_nombre,
  fulfillment_status
FROM sales_orders
WHERE ruta = 'whatsapp_manual'
  AND fulfillment_status IN ('PICKING', 'PACKED', 'SHIPPED')
  AND (latitud IS NULL OR longitud IS NULL)
ORDER BY created_at DESC;

-- → Vendedor debe agregar coords antes de enviar con courier
```

---

## 🚀 Script de Validación Completo

```sql
-- Ejecutar todo esto para validar la migración
\echo '=== VALIDACIÓN COMPLETA DE MIGRACIÓN ==='
\echo ''

\echo '1. Verificar columnas nuevas en sales_orders:'
SELECT COUNT(*) as columnas_nuevas 
FROM information_schema.columns 
WHERE table_name = 'sales_orders' 
  AND column_name IN ('ruta', 'latitud', 'longitud', 'url_google_maps', 
                      'referencia_adicional', 'asignado_a_vendedor_id',
                      'estado_confirmacion', 'timestamp_envio_wa', 
                      'timestamp_confirmacion_cliente', 'comprobante_prepago');

\echo '2. Verificar tabla vendedores existe:'
SELECT COUNT(*) as vendedores_table 
FROM information_schema.tables 
WHERE table_name = 'vendedores';

\echo '3. Verificar tabla wa_messages_log existe:'
SELECT COUNT(*) as wa_messages_table 
FROM information_schema.tables 
WHERE table_name = 'wa_messages_log';

\echo '4. Verificar índices:'
SELECT COUNT(*) as indices_count 
FROM pg_indexes 
WHERE tablename = 'sales_orders' 
  AND indexname LIKE 'idx_sales_orders_%';

\echo '5. Verificar vista v_pedidos_whatsapp_manual:'
SELECT COUNT(*) as vista_count 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'v_pedidos_whatsapp_manual';

\echo ''
\echo '✅ Migración completada exitosamente si todos los conteos son > 0'
```

---

## 📝 Notas Importantes

- **Reemplazar UUIDs:** En los queries, reemplaza `'uuid-xxx'` con UUIDs reales
- **Reemplazar order_number:** Reemplaza `'SO-2025-001'` con números reales
- **Información sensible:** No compartir teléfonos o direcciones fuera de sistemas seguros
- **Performance:** Usar índices creados (no hacer queries sin índices)
- **Backups:** Hacer backup antes de ejecutar queries de actualización/eliminación


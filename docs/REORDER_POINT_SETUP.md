# 🧠 Sistema Automático de Punto de Reorden (ROP)

## ✅ Implementación Completada

Se ha implementado un sistema inteligente que calcula automáticamente el **Punto de Reorden (ROP)** para cada producto basándose en el historial real de ventas.

---

## 📊 Fórmula Implementada

### La "Salsa Secreta" del ERP

```
ROP = (Demanda durante Lead Time) + (Stock de Seguridad)

Donde:
- ADS (Average Daily Sales) = Total vendido últimos 90 días / 90
- MDS (Max Daily Sales) = Mayor venta en un solo día
- Lead Time = Días que tarda el proveedor en entregar
- Max Lead Time = Lead Time × 1.3 (30% buffer)
- Safety Stock = (MDS × Max Lead Time) - (ADS × Lead Time)
- ROP = (ADS × Lead Time) + Safety Stock
```

### Ejemplo Práctico: "Media Compresiva"

```
Ventas promedio: 5 unidades/día
Venta máxima en 1 día: 8 unidades
Lead Time proveedor: 10 días
Max Lead Time (buffer): 10 × 1.3 = 13 días

Cálculos:
- Demanda esperada = 5 × 10 = 50 unidades
- Safety Stock = (8 × 13) - (5 × 10) = 104 - 50 = 54 unidades
- ROP = 50 + 54 = 104 unidades

📌 Conclusión: Cuando el stock baje a 104 unidades, 
   crear automáticamente una PO.
```

---

## 🚀 Cómo Usar

### Opción 1: Ejecución Manual (Testing)

Ejecuta en tu consola SQL de Supabase:

```sql
-- Ver resultados detallados por producto
SELECT * FROM calculate_reorder_points();

-- O ejecutar y obtener resumen JSON
SELECT run_reorder_calculation();
```

### Opción 2: Desde Edge Function (Recomendado)

El edge function ya está creado: `calculate-reorder-points`

Puedes invocarlo manualmente desde el código:

```typescript
const { data, error } = await supabase.functions.invoke('calculate-reorder-points');

if (data) {
  console.log('ROP calculados:', data.result);
  console.log('Productos que necesitan reorden:', data.alerts);
}
```

### Opción 3: Cron Job Automático (Producción)

Para ejecutar automáticamente **cada noche a las 2 AM**:

#### Paso 1: Habilitar extensiones en Supabase

En tu SQL Editor de Supabase Cloud, ejecuta:

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### Paso 2: Crear el Cron Job

**IMPORTANTE:** Reemplaza `YOUR_PROJECT_REF` y `YOUR_ANON_KEY` con tus valores reales.

```sql
SELECT cron.schedule(
  'calculate-rop-nightly',           -- Nombre del job
  '0 2 * * *',                       -- Todos los días a las 2 AM
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/calculate-reorder-points',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**Valores a reemplazar:**
- `YOUR_PROJECT_REF`: Encuentra esto en tu dashboard de Supabase → Settings → API
- `YOUR_ANON_KEY`: Tu clave anónima de Supabase (también en Settings → API)

#### Ejemplo completo:

```sql
SELECT cron.schedule(
  'calculate-rop-nightly',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://pvgcrywkxzbgeywwhyqm.supabase.co/functions/v1/calculate-reorder-points',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGci..."}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

---

## 🔍 Verificar Resultados

### Ver productos actualizados

```sql
SELECT 
  product_code,
  nombre_producto,
  cantidad_stock as "Stock Actual",
  ai_reorder_point as "Punto de Reorden (AI)",
  cantidad_stock - ai_reorder_point as "Margen",
  CASE 
    WHEN cantidad_stock <= ai_reorder_point THEN '🔴 ORDENAR YA'
    WHEN cantidad_stock <= (ai_reorder_point * 1.2) THEN '🟡 Próximo a reordenar'
    ELSE '🟢 Stock OK'
  END as "Estado"
FROM products
WHERE ai_reorder_point IS NOT NULL
  AND (is_discontinued = FALSE OR is_discontinued IS NULL)
ORDER BY (cantidad_stock - ai_reorder_point) ASC;
```

### Ver historial de cron jobs

```sql
-- Ver todos los jobs programados
SELECT * FROM cron.job;

-- Ver historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'calculate-rop-nightly')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 📈 Integración con Alertas Automáticas

### Opción: Crear PO automáticamente cuando ROP se alcanza

Puedes crear un trigger que detecte cuando `cantidad_stock <= ai_reorder_point`:

```sql
CREATE OR REPLACE FUNCTION check_reorder_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el stock baja al punto de reorden o menos
  IF NEW.cantidad_stock <= NEW.ai_reorder_point AND NEW.ai_reorder_point IS NOT NULL THEN
    
    -- Aquí podrías:
    -- 1. Crear una notificación
    -- 2. Generar un borrador de PO automáticamente
    -- 3. Enviar un email al equipo de compras
    
    RAISE NOTICE 'ALERTA: Producto % ha alcanzado su punto de reorden. Stock: %, ROP: %',
      NEW.product_code, NEW.cantidad_stock, NEW.ai_reorder_point;
    
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_reorder_alert
  AFTER UPDATE OF cantidad_stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_reorder_alert();
```

---

## 🎯 Casos Especiales

### Productos sin historial de ventas

```
Si un producto tiene:
- ADS = 0 (no hay ventas en 90 días)
- MDS = 0 (nunca se vendió en un día)

Entonces:
- ai_reorder_point = 10 (valor default conservador)
```

### Productos sin vendor asignado

```
Si un producto no tiene vendor_id:
- Lead Time = 7 días (default)
- Se calcula ROP normalmente con este valor
```

---

## 🔧 Mantenimiento

### Cambiar la frecuencia del cron

```sql
-- Ver el job actual
SELECT * FROM cron.job WHERE jobname = 'calculate-rop-nightly';

-- Eliminar el job actual
SELECT cron.unschedule('calculate-rop-nightly');

-- Crear con nueva frecuencia (ejemplo: cada 12 horas)
SELECT cron.schedule(
  'calculate-rop-twice-daily',
  '0 2,14 * * *',  -- A las 2 AM y 2 PM
  $$
  SELECT net.http_post(...);
  $$
);
```

### Recalcular ROP manualmente para un producto específico

```sql
-- Temporal: actualizar solo un producto
UPDATE products 
SET ai_reorder_point = (
  SELECT calculated_rop 
  FROM calculate_reorder_points() 
  WHERE product_code = 'PRODUCT_CODE_AQUI'
  LIMIT 1
)
WHERE product_code = 'PRODUCT_CODE_AQUI';
```

---

## 📊 Dashboard Sugerido

Crea una vista en tu admin para monitorear:

1. **Productos que necesitan reorden YA**
   - `cantidad_stock <= ai_reorder_point`
   - Botón "Crear PO Automática"

2. **Próximos a reordenar (zona amarilla)**
   - `cantidad_stock <= ai_reorder_point * 1.2`

3. **Stock saludable**
   - `cantidad_stock > ai_reorder_point * 1.2`

---

## 🚨 Troubleshooting

### El cron no se ejecuta

1. Verifica que las extensiones estén habilitadas:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
   ```

2. Verifica los logs:
   ```sql
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC LIMIT 10;
   ```

3. Verifica que la URL y el token sean correctos.

### Los valores ROP parecen incorrectos

1. Verifica que haya historial de ventas:
   ```sql
   SELECT 
     product_code,
     COUNT(*) as total_sales,
     SUM(quantity) as total_qty
   FROM sales_order_items
   WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY product_code;
   ```

2. Verifica que los vendors tengan `lead_time_days` configurado:
   ```sql
   SELECT id, name, lead_time_days FROM vendors;
   ```

---

## 🎓 Recursos

- [Documentación pg_cron](https://github.com/citusdata/pg_cron)
- [Fórmula ROP explicada](https://www.investopedia.com/terms/r/reorder-point.asp)
- [Safety Stock Best Practices](https://www.lokad.com/safety-stock-definition)

---

## 📌 Próximos Pasos Sugeridos

1. ✅ **Implementar dashboard de alertas** en admin panel
2. ✅ **Crear PO automática** cuando se alcance ROP
3. ✅ **Email notifications** al equipo de compras
4. ✅ **Reportes semanales** de rotación de inventario
5. ✅ **Machine Learning** para predecir demanda futura (próxima fase)

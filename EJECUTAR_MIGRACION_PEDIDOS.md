# ⚠️ Ejecutar Migración de Tabla PEDIDOS

## Problema
La tabla `pedidos` aún no se ha creado en Supabase remoto. El sistema actualmente usa `sales_orders` como fallback, pero necesita `pedidos` para funcionalidad completa.

## Solución
Ejecuta el siguiente SQL en el **SQL Editor de Supabase**:

### Pasos:
1. Abre https://supabase.com/dashboard/project/lqeevfvrtifsidfghtwz/sql/new
2. Copia TODO el contenido del archivo: `supabase/migrations/20251130_crear_tabla_pedidos.sql`
3. Pega en el editor SQL
4. Haz clic en **▶️ Execute** (o Ctrl+Enter)
5. Espera a que se ejecute sin errores

### Luego ejecuta:
`supabase/migrations/20251130_extension_sales_orders_ruta_b.sql`

## Archivos SQL a ejecutar (EN ORDEN):

1. **`supabase/migrations/20251130_crear_tabla_pedidos.sql`** - Crea tabla y tipos ENUM
2. **`supabase/migrations/20251130_extension_sales_orders_ruta_b.sql`** - Extiende sales_orders

## Verificación
Después de ejecutar, en el SQL Editor ejecuta:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'pedidos' AND table_schema = 'public';
```

Deberías ver: `pedidos` en los resultados.

## Alternativa: Via CLI
Si tienes Supabase CLI instalado:
```bash
supabase db push
```

---

**Nota**: Los pedidos creados ahora se guardarán en `sales_orders`, pero una vez ejecutada la migración, se usará `pedidos` directamente.

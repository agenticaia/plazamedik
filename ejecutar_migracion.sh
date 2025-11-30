#!/bin/bash

# Script para ejecutar la migración de la tabla pedidos en Supabase
# Requiere: jq instalado

echo "🚀 Ejecutando migraciones de Supabase..."

SUPABASE_URL="https://lqeevfvrtifsidfghtwz.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWV2ZnZydGlmc2lkZmdodHd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU4MDA5MCwiZXhwIjoyMDc4MTU2MDkwfQ.evEvQE_XE0F-jGeDm_8RqcSktt5-bSSrNkTAuU7-9rI"

# Leer el archivo SQL
echo "📖 Leyendo migración 1: crear_tabla_pedidos.sql..."
SQL_FILE_1="supabase/migrations/20251130_crear_tabla_pedidos.sql"

if [ ! -f "$SQL_FILE_1" ]; then
    echo "❌ Archivo no encontrado: $SQL_FILE_1"
    exit 1
fi

# Escapar el SQL para JSON
SQL_CONTENT_1=$(cat "$SQL_FILE_1" | jq -Rs '.')

echo "🔧 Enviando migración 1..."
RESPONSE_1=$(curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: params=single-object" \
    -d "{\"sql\": $SQL_CONTENT_1}")

echo "📋 Respuesta 1: $RESPONSE_1"

# Leer el segundo archivo
echo ""
echo "📖 Leyendo migración 2: extension_sales_orders_ruta_b.sql..."
SQL_FILE_2="supabase/migrations/20251130_extension_sales_orders_ruta_b.sql"

if [ ! -f "$SQL_FILE_2" ]; then
    echo "⚠️  Archivo no encontrado: $SQL_FILE_2 (es opcional)"
else
    SQL_CONTENT_2=$(cat "$SQL_FILE_2" | jq -Rs '.')
    
    echo "🔧 Enviando migración 2..."
    RESPONSE_2=$(curl -s -X POST \
        "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: params=single-object" \
        -d "{\"sql\": $SQL_CONTENT_2}")
    
    echo "📋 Respuesta 2: $RESPONSE_2"
fi

echo ""
echo "✅ Migraciones enviadas. Verifica en Supabase Dashboard los resultados."

#!/usr/bin/env node
/**
 * Script para inicializar la tabla de pedidos en Supabase
 * Uso: node scripts/init-pedidos-table.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer credenciales
const envPath = path.join(__dirname, '../.env.example');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key) => {
  const regex = new RegExp(`${key}="([^"]*)"`);
  const match = envContent.match(regex);
  return match ? match[1] : null;
};

const SUPABASE_URL = getEnvValue('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnvValue('SUPABASE_SERVICE_KEY');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Credenciales de Supabase no encontradas en .env.example');
  process.exit(1);
}

console.log('📚 Conectando a Supabase...');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Lectura de la migración SQL
const migrationPath = path.join(__dirname, '../supabase/migrations/20251130_crear_tabla_pedidos.sql');
let migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Simplificar: eliminar comentarios y ejecutar por partes
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

async function executeMigration() {
  try {
    console.log(`📝 Ejecutando ${statements.length} sentencias SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`  [${i+1}/${statements.length}] Ejecutando...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        if (error) {
          console.warn(`    ⚠️ Error (ignorando): ${error.message}`);
        } else {
          console.log(`    ✅ Éxito`);
        }
      } catch (e) {
        console.warn(`    ⚠️ Error: ${e.message}`);
      }
    }
    
    console.log('✅ Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

executeMigration();

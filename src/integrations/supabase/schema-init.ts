/**
 * Servicio para inicializar el esquema de pedidos en Supabase
 * Este archivo se ejecuta automáticamente al cargar el cliente Supabase
 */

import { supabase } from './client';

let initalized = false;

export async function initPedidosSchema() {
  if (initalized) return;
  
  try {
    console.log('🚀 Inicializando esquema de pedidos...');
    
    // 1. Intentar una consulta simple para verificar si la tabla existe
    const { data: existingData, error: checkError } = await supabase
      .from('pedidos')
      .select('COUNT(*)', { count: 'exact', head: true })
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Tabla pedidos ya existe');
      initalized = true;
      return;
    }
    
    // Si no existe, intentar crear la tabla con raw SQL (si el cliente lo permite)
    console.log('⚠️ Tabla pedidos no existe, creando...');
    console.log('❌ Nota: Se requiere ejecutar la migración manualmente en Supabase');
    
    initalized = true;
  } catch (error) {
    console.error('Error durante inicialización:', error);
  }
}

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Intentando conectar a Supabase...');
console.log('URL:', supabaseUrl ? '✓' : '✗ FALTA');
console.log('Key:', supabaseKey ? '✓' : '✗ FALTA\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  Las credenciales están en .env, que no está en git.');
  console.log('Si quieres revisar productos, configura .env con las credenciales de Supabase.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('nombre_producto, categoria')
      .gt('cantidad_stock', 0)
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Primeros 20 productos:');
    data?.forEach((p, i) => {
      console.log(`${i+1}. ${p.nombre_producto} (${p.categoria})`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspect();

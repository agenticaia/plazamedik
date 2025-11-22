import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando cálculo de Puntos de Reorden (ROP)...');

    // Ejecutar la función que calcula los ROP
    const { data: result, error } = await supabase.rpc('run_reorder_calculation');

    if (error) {
      console.error('❌ Error al calcular ROP:', error);
      throw error;
    }

    console.log('✅ Cálculo completado:', result);

    // Obtener algunos ejemplos de productos actualizados
    const { data: samples, error: sampleError } = await supabase
      .from('products')
      .select('product_code, nombre_producto, ai_reorder_point, cantidad_stock, vendor_id')
      .not('ai_reorder_point', 'is', null)
      .limit(5);

    if (sampleError) {
      console.error('⚠️ Error al obtener muestras:', sampleError);
    }

    // Identificar productos que necesitan reorden AHORA
    const { data: needsReorder, error: reorderError } = await supabase
      .from('products')
      .select('product_code, nombre_producto, cantidad_stock, ai_reorder_point')
      .not('ai_reorder_point', 'is', null)
      .filter('cantidad_stock', 'lte', 'ai_reorder_point');

    if (reorderError) {
      console.error('⚠️ Error al verificar alertas:', reorderError);
    }

    console.log(`📊 Productos que necesitan reorden: ${needsReorder?.length || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        result: result,
        samples: samples || [],
        alerts: {
          products_need_reorder: needsReorder?.length || 0,
          products: needsReorder || []
        },
        executed_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Error fatal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        executed_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

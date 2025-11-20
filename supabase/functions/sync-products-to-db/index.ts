import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaticProduct {
  code: string;
  name: string;
  subtitle: string;
  image: string;
  benefits: string[];
  specs: string[];
  idealFor: string;
  category: string[];
  type: string;
  sizes: string[];
  colors: string[];
  priceOriginal: number;
  priceSale: number;
  compression: string;
  brand: string;
  model: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { products } = await req.json();

    if (!Array.isArray(products)) {
      return new Response(
        JSON.stringify({ error: "Se requiere un array de productos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const product of products as StaticProduct[]) {
      try {
        // Verificar si el producto existe
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("product_code", product.code)
          .single();

        // Determinar categoría principal
        const categoria = product.category[0] || "medias-compresion";

        const productData = {
          product_code: product.code,
          nombre_producto: product.name,
          categoria,
          precio: product.priceSale,
          precio_anterior: product.priceOriginal,
          cantidad_stock: 50, // Stock inicial default
          imagen_url: product.image,
          descripcion_corta: product.subtitle,
          tallas_disponibles: product.sizes,
          colores_disponibles: product.colors,
          ideal_para: product.idealFor,
          beneficios: product.benefits,
          especificaciones: product.specs,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          // Actualizar producto existente
          const { error } = await supabase
            .from("products")
            .update(productData)
            .eq("product_code", product.code);

          if (error) throw error;
          results.updated++;
        } else {
          // Crear nuevo producto
          const { error } = await supabase
            .from("products")
            .insert({
              ...productData,
              created_at: new Date().toISOString(),
            });

          if (error) throw error;
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing product ${product.code}:`, error);
        results.errors.push(`${product.code}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización completada: ${results.created} creados, ${results.updated} actualizados`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-products-to-db:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

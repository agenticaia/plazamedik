import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customer_name,
      customer_lastname,
      customer_phone,
      customer_district,
      customer_address,
      customer_lat,
      customer_lng,
      product_code,
      product_name,
      product_color,
      product_price,
      quantity = 1,
      source = 'web',
    } = await req.json();

    // Validar campos requeridos
    if (!customer_name || !customer_lastname || !customer_phone || !customer_district || !customer_address ||
        !product_code || !product_name || !product_color || product_price === undefined) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar precio
    const priceNum = Number(product_price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      return new Response(
        JSON.stringify({ error: 'Precio inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generar número de orden de venta
    const { data: orderNumber, error: orderNumberError } = await supabase
      .rpc('generate_sales_order_number');

    if (orderNumberError) throw orderNumberError;

    const total = priceNum * quantity;

    // Crear orden de venta
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .insert({
        order_number: orderNumber,
        customer_name: String(customer_name).slice(0, 100),
        customer_lastname: String(customer_lastname).slice(0, 100),
        customer_phone: String(customer_phone).slice(0, 20),
        customer_district: String(customer_district).slice(0, 100),
        customer_address: customer_address ? String(customer_address).slice(0, 500) : null,
        customer_lat: customer_lat ? Number(customer_lat) : null,
        customer_lng: customer_lng ? Number(customer_lng) : null,
        total: total,
        fulfillment_status: 'UNFULFILLED',
        payment_status: 'PENDING',
        payment_method: 'CONTRA_ENTREGA',
        source: source,
      })
      .select()
      .single();

    if (salesOrderError) throw salesOrderError;

    // Crear item de orden
    const { error: itemError } = await supabase
      .from('sales_order_items')
      .insert({
        sales_order_id: salesOrder.id,
        product_code: String(product_code).slice(0, 20),
        product_name: String(product_name).slice(0, 200),
        product_color: String(product_color).slice(0, 50),
        quantity: quantity,
        unit_price: priceNum,
      });

    if (itemError) throw itemError;

    console.log('Pedido creado:', orderNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_number: orderNumber,
        order_id: salesOrder.id,
        total: total,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error al crear pedido:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

    const { salesOrderId } = await req.json();

    console.log('Processing sales order:', salesOrderId);

    // Get the sales order with items
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('*, items:sales_order_items(*)')
      .eq('id', salesOrderId)
      .single();

    if (orderError) throw orderError;

    const backorderItems = [];
    const fulfilledItems = [];
    
    // Check stock for each item
    for (const item of order.items) {
      const { data: product } = await supabase
        .from('products')
        .select('cantidad_stock, preferred_supplier_id, cost, precio')
        .eq('product_code', item.product_code)
        .single();

      if (!product || (product.cantidad_stock || 0) < item.quantity) {
        // Scenario 2: No Stock - Create backorder and Draft PO
        console.log(`No stock for ${item.product_code}. Creating backorder...`);
        backorderItems.push(item);

        // Mark item as backorder
        await supabase
          .from('sales_order_items')
          .update({ is_backorder: true })
          .eq('id', item.id);

        // Generate PO number
        const { data: poNumber } = await supabase.rpc('generate_po_number_sequential');

        // Get supplier
        const supplierId = product?.preferred_supplier_id || await getFirstActiveSupplier(supabase);

        // Create Draft PO automatically
        const { data: newPO } = await supabase
          .from('purchase_orders')
          .insert({
            order_number: poNumber,
            supplier_id: supplierId,
            product_code: item.product_code,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: product?.cost || product?.precio * 0.6,
            total_amount: (product?.cost || product?.precio * 0.6) * item.quantity,
            status: 'DRAFT',
            order_type: 'automatica',
            po_type: 'BACKORDER_FULFILLMENT',
            priority: 'HIGH',
            linked_sales_order_id: salesOrderId,
            notes: `Auto-generada por backorder de orden ${order.order_number}. CROSS-DOCKING: Enviar directo al cliente sin almacenar.`
          })
          .select()
          .single();

        // Link PO to item
        if (newPO) {
          await supabase
            .from('sales_order_items')
            .update({ linked_purchase_order_id: newPO.id })
            .eq('id', item.id);
        }

        // Log automation
        await supabase
          .from('order_state_log')
          .insert({
            sales_order_id: salesOrderId,
            from_state: 'NEW',
            to_state: 'BACKORDER_PO_CREATED',
            notes: `PO automática creada: ${poNumber} para cross-docking`,
            automated: true
          });

      } else {
        // Scenario 1: Has Stock - Reserve it
        console.log(`Stock available for ${item.product_code}. Reserving...`);
        fulfilledItems.push(item);

        // Reserve stock
        await supabase
          .from('products')
          .update({ 
            cantidad_stock: product.cantidad_stock - item.quantity 
          })
          .eq('product_code', item.product_code);

        // Log stock reservation
        await supabase
          .from('order_state_log')
          .insert({
            sales_order_id: salesOrderId,
            from_state: 'NEW',
            to_state: 'STOCK_RESERVED',
            notes: `Stock reservado: ${item.quantity} unidades de ${item.product_code}`,
            automated: true
          });
      }
    }

    // Update order fulfillment status
    let fulfillmentStatus = 'UNFULFILLED';
    if (backorderItems.length === order.items.length) {
      fulfillmentStatus = 'WAITING_STOCK';
    } else if (backorderItems.length > 0) {
      fulfillmentStatus = 'PARTIAL';
    } else if (fulfilledItems.length === order.items.length) {
      // All items have stock, can start picking
      fulfillmentStatus = 'UNFULFILLED';
      await supabase
        .from('sales_orders')
        .update({ 
          fulfillment_status: 'UNFULFILLED',
          picking_started_at: new Date().toISOString() 
        })
        .eq('id', salesOrderId);
    }

    await supabase
      .from('sales_orders')
      .update({ fulfillment_status: fulfillmentStatus })
      .eq('id', salesOrderId);

    return new Response(
      JSON.stringify({
        success: true,
        backorderItems: backorderItems.length,
        fulfilledItems: fulfilledItems.length,
        fulfillmentStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing sales order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getFirstActiveSupplier(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('suppliers')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .single();
  return data?.id;
}

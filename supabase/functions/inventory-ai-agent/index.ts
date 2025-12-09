import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the tools the AI agent can use
const agentTools = [
  {
    type: "function",
    function: {
      name: "update_purchase_order_status",
      description: "Update the status of a purchase order. Use this when the user asks to change PO status, send a PO to supplier, approve a PO, mark as received, etc.",
      parameters: {
        type: "object",
        properties: {
          order_number: {
            type: "string",
            description: "The purchase order number (e.g., PO-2025-5004)"
          },
          new_status: {
            type: "string",
            enum: ["DRAFT", "SENT", "CONFIRMED", "IN_TRANSIT", "PARTIAL_RECEIVED", "RECEIVED", "CLOSED", "CANCELLED"],
            description: "The new status for the purchase order"
          },
          notes: {
            type: "string",
            description: "Optional notes about the status change"
          }
        },
        required: ["order_number", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_sales_order_status",
      description: "Update the fulfillment status of a sales order. Use this when the user asks to change order status, start picking, mark as packed, shipped, or delivered.",
      parameters: {
        type: "object",
        properties: {
          order_number: {
            type: "string",
            description: "The sales order number (e.g., ORD-2025-0001)"
          },
          new_status: {
            type: "string",
            enum: ["UNFULFILLED", "WAITING_STOCK", "PICKING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"],
            description: "The new fulfillment status for the sales order"
          },
          notes: {
            type: "string",
            description: "Optional notes about the status change"
          }
        },
        required: ["order_number", "new_status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_purchase_order",
      description: "Create a new purchase order for inventory replenishment. Use this when the user asks to order more stock, create a PO, or replenish inventory.",
      parameters: {
        type: "object",
        properties: {
          product_code: {
            type: "string",
            description: "The product code to order"
          },
          quantity: {
            type: "number",
            description: "The quantity to order"
          },
          supplier_id: {
            type: "string",
            description: "The UUID of the supplier (optional, will use product's preferred supplier if not provided)"
          },
          priority: {
            type: "string",
            enum: ["NORMAL", "HIGH", "URGENT"],
            description: "The priority of the order"
          },
          notes: {
            type: "string",
            description: "Optional notes for the purchase order"
          }
        },
        required: ["product_code", "quantity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_product_stock",
      description: "Update the stock quantity of a product. Use this for manual stock adjustments.",
      parameters: {
        type: "object",
        properties: {
          product_code: {
            type: "string",
            description: "The product code"
          },
          new_quantity: {
            type: "number",
            description: "The new stock quantity"
          },
          reason: {
            type: "string",
            description: "Reason for the stock adjustment"
          }
        },
        required: ["product_code", "new_quantity"]
      }
    }
  }
];

// Execute the tool actions
async function executeToolAction(supabase: any, toolName: string, args: any): Promise<{ success: boolean; message: string; data?: any }> {
  console.log(`Executing tool: ${toolName} with args:`, args);

  try {
    switch (toolName) {
      case "update_purchase_order_status": {
        const { order_number, new_status, notes } = args;
        
        // First, find the PO by order_number
        const { data: po, error: findError } = await supabase
          .from('purchase_orders')
          .select('id, order_number, status, product_name, quantity')
          .eq('order_number', order_number)
          .maybeSingle();

        if (findError) {
          console.error('Error finding PO:', findError);
          return { success: false, message: `Error buscando la orden: ${findError.message}` };
        }

        if (!po) {
          return { success: false, message: `No se encontró la orden de compra ${order_number}` };
        }

        const oldStatus = po.status;

        // Update the PO status
        const updateData: any = {
          status: new_status,
          updated_at: new Date().toISOString()
        };

        if (notes) {
          updateData.notes = notes;
        }

        // Set specific timestamps based on status
        if (new_status === 'RECEIVED') {
          updateData.actual_delivery_date = new Date().toISOString().split('T')[0];
        }

        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update(updateData)
          .eq('id', po.id);

        if (updateError) {
          console.error('Error updating PO:', updateError);
          return { success: false, message: `Error actualizando la orden: ${updateError.message}` };
        }

        return {
          success: true,
          message: `✅ Orden de compra ${order_number} actualizada exitosamente de ${oldStatus} a ${new_status}`,
          data: {
            order_number,
            old_status: oldStatus,
            new_status,
            product_name: po.product_name,
            quantity: po.quantity
          }
        };
      }

      case "update_sales_order_status": {
        const { order_number, new_status, notes } = args;
        
        const { data: so, error: findError } = await supabase
          .from('sales_orders')
          .select('id, order_number, fulfillment_status, customer_name, total')
          .eq('order_number', order_number)
          .maybeSingle();

        if (findError || !so) {
          return { success: false, message: `No se encontró el pedido ${order_number}` };
        }

        const oldStatus = so.fulfillment_status;

        const updateData: any = {
          fulfillment_status: new_status,
          updated_at: new Date().toISOString()
        };

        if (notes) {
          updateData.notes = notes;
        }

        // Set specific timestamps
        if (new_status === 'PICKING') updateData.picking_started_at = new Date().toISOString();
        if (new_status === 'PACKED') updateData.packed_at = new Date().toISOString();
        if (new_status === 'SHIPPED') updateData.shipped_at = new Date().toISOString();
        if (new_status === 'DELIVERED') updateData.delivered_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('sales_orders')
          .update(updateData)
          .eq('id', so.id);

        if (updateError) {
          return { success: false, message: `Error actualizando el pedido: ${updateError.message}` };
        }

        // Log the state change
        await supabase.from('order_state_log').insert({
          sales_order_id: so.id,
          from_state: oldStatus,
          to_state: new_status,
          notes: notes || `Cambio de estado por Agente IA`,
          automated: true
        });

        return {
          success: true,
          message: `✅ Pedido ${order_number} actualizado de ${oldStatus} a ${new_status}`,
          data: {
            order_number,
            old_status: oldStatus,
            new_status,
            customer_name: so.customer_name
          }
        };
      }

      case "create_purchase_order": {
        const { product_code, quantity, supplier_id, priority, notes } = args;
        
        // Get product info
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*, preferred_supplier_id, cost, precio')
          .eq('product_code', product_code)
          .maybeSingle();

        if (productError || !product) {
          return { success: false, message: `No se encontró el producto ${product_code}` };
        }

        // Get supplier
        let finalSupplierId = supplier_id || product.preferred_supplier_id;
        if (!finalSupplierId) {
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          finalSupplierId = supplier?.id;
        }

        if (!finalSupplierId) {
          return { success: false, message: 'No hay proveedor disponible para crear la orden' };
        }

        // Generate PO number
        const { data: poNumber } = await supabase.rpc('generate_po_number_sequential');

        const unitPrice = product.cost || (product.precio * 0.6);

        const { data: newPO, error: createError } = await supabase
          .from('purchase_orders')
          .insert({
            order_number: poNumber,
            supplier_id: finalSupplierId,
            product_code: product.product_code,
            product_name: product.nombre_producto,
            quantity,
            unit_price: unitPrice,
            total_amount: quantity * unitPrice,
            total_cost: quantity * unitPrice,
            status: 'DRAFT',
            order_type: 'automatica',
            po_type: 'STOCK_REPLENISHMENT',
            priority: priority || 'NORMAL',
            notes: notes || `Creada por Agente IA`
          })
          .select()
          .single();

        if (createError) {
          return { success: false, message: `Error creando la orden: ${createError.message}` };
        }

        // Create PO item
        await supabase.from('purchase_order_items').insert({
          purchase_order_id: newPO.id,
          product_code: product.product_code,
          product_name: product.nombre_producto,
          qty_ordered: quantity,
          cost_per_unit: unitPrice,
          qty_received: 0
        });

        return {
          success: true,
          message: `✅ Orden de compra ${poNumber} creada exitosamente para ${quantity} unidades de ${product.nombre_producto}`,
          data: {
            order_number: poNumber,
            product_name: product.nombre_producto,
            quantity,
            total: quantity * unitPrice
          }
        };
      }

      case "update_product_stock": {
        const { product_code, new_quantity, reason } = args;
        
        const { data: product, error: findError } = await supabase
          .from('products')
          .select('nombre_producto, cantidad_stock')
          .eq('product_code', product_code)
          .maybeSingle();

        if (findError || !product) {
          return { success: false, message: `No se encontró el producto ${product_code}` };
        }

        const oldStock = product.cantidad_stock;

        const { error: updateError } = await supabase
          .from('products')
          .update({
            cantidad_stock: new_quantity,
            updated_at: new Date().toISOString()
          })
          .eq('product_code', product_code);

        if (updateError) {
          return { success: false, message: `Error actualizando stock: ${updateError.message}` };
        }

        return {
          success: true,
          message: `✅ Stock de ${product.nombre_producto} actualizado de ${oldStock} a ${new_quantity} unidades. Razón: ${reason || 'Ajuste manual por Agente IA'}`,
          data: {
            product_code,
            product_name: product.nombre_producto,
            old_stock: oldStock,
            new_stock: new_quantity
          }
        };
      }

      default:
        return { success: false, message: `Herramienta no reconocida: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { success: false, message: `Error ejecutando acción: ${error.message}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    console.log('Received question:', question);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Solo administradores pueden usar este asistente' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching comprehensive business data...');

    // Fetch ALL relevant data from database including orders, WhatsApp, vendors
    const [
      { data: products },
      { data: suppliers },
      { data: vendors },
      { data: salesOrders },
      { data: salesOrderItems },
      { data: purchaseOrders },
      { data: purchaseOrderItems },
      { data: customers },
      { data: vendedores },
      { data: waMessagesLog },
      { data: lowStockProducts },
      { data: dashboardMetrics },
    ] = await Promise.all([
      supabase.from('products')
        .select('*')
        .or('is_discontinued.eq.false,is_discontinued.is.null')
        .order('nombre_producto'),
      supabase.from('suppliers').select('*').eq('is_active', true),
      supabase.from('vendors').select('*').eq('is_active', true),
      supabase.from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('sales_order_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('purchase_order_items').select('*').limit(200),
      supabase.from('customers').select('*').order('total_spent', { ascending: false }).limit(100),
      supabase.from('vendedores').select('*'),
      supabase.from('wa_messages_log')
        .select('*')
        .order('timestamp_sent', { ascending: false })
        .limit(100),
      supabase.rpc('get_low_stock_products', { p_threshold: 20 }),
      supabase.rpc('get_dashboard_metrics'),
    ]);

    console.log('Data fetched - Products:', products?.length, 'SOs:', salesOrders?.length, 'POs:', purchaseOrders?.length);

    // Calculate analytics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Orders analytics
    const todayOrders = salesOrders?.filter(o => new Date(o.created_at) >= todayStart) || [];
    const todaySalesTotal = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const monthOrders = salesOrders?.filter(o => new Date(o.created_at) >= monthStart) || [];
    const monthSalesTotal = monthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Order status breakdown
    const ordersByStatus = {
      UNFULFILLED: salesOrders?.filter(o => o.fulfillment_status === 'UNFULFILLED') || [],
      WAITING_STOCK: salesOrders?.filter(o => o.fulfillment_status === 'WAITING_STOCK') || [],
      PICKING: salesOrders?.filter(o => o.fulfillment_status === 'PICKING') || [],
      PACKED: salesOrders?.filter(o => o.fulfillment_status === 'PACKED') || [],
      SHIPPED: salesOrders?.filter(o => o.fulfillment_status === 'SHIPPED') || [],
      DELIVERED: salesOrders?.filter(o => o.fulfillment_status === 'DELIVERED') || [],
    };

    // PO status breakdown
    const posByStatus = {
      DRAFT: purchaseOrders?.filter(po => po.status === 'DRAFT') || [],
      SENT: purchaseOrders?.filter(po => po.status === 'SENT') || [],
      CONFIRMED: purchaseOrders?.filter(po => po.status === 'CONFIRMED') || [],
      IN_TRANSIT: purchaseOrders?.filter(po => po.status === 'IN_TRANSIT') || [],
      RECEIVED: purchaseOrders?.filter(po => po.status === 'RECEIVED') || [],
    };

    // Source/channel analytics
    const ordersBySource = {
      whatsapp_manual: salesOrders?.filter(o => o.ruta === 'whatsapp_manual' || o.source === 'whatsapp_manual') || [],
      web_form: salesOrders?.filter(o => o.ruta === 'web_form' || o.source === 'web_form' || !o.ruta) || [],
    };

    // Inventory analytics
    const inventoryValue = products?.reduce((sum, p) => 
      sum + (Number(p.precio || 0) * (p.cantidad_stock || 0)), 0
    ) || 0;

    const criticalStock = products?.filter(p => 
      p.cantidad_stock !== null && p.cantidad_stock <= 5
    ) || [];

    const outOfStock = products?.filter(p => 
      p.cantidad_stock !== null && p.cantidad_stock === 0
    ) || [];

    // Build context for AI
    const context = `
Eres el **Asistente IA Agente** de PlazaMedik. Eres un agente AGENTIC con capacidad de EJECUTAR ACCIONES REALES en la base de datos.

**IMPORTANTE - ERES UN AGENTE AGENTIC:**
- Cuando el usuario te pide realizar una acción (cambiar estado de PO, actualizar pedido, crear órdenes), DEBES usar las herramientas disponibles para ejecutar la acción REALMENTE.
- NO solo describas lo que harías, USA LAS HERRAMIENTAS para hacerlo.
- Después de ejecutar una acción, confirma al usuario el resultado real.

Fecha y hora actual: ${now.toLocaleString('es-PE', { timeZone: 'America/Lima' })}

═══════════════════════════════════════════════════════════════
📊 DATOS ACTUALES DEL NEGOCIO
═══════════════════════════════════════════════════════════════

**VENTAS HOY:** S/ ${todaySalesTotal.toFixed(2)} (${todayOrders.length} pedidos)
**VENTAS MES:** S/ ${monthSalesTotal.toFixed(2)} (${monthOrders.length} pedidos)
**VALOR INVENTARIO:** S/ ${inventoryValue.toFixed(2)}

**ESTADO DE PEDIDOS:**
• Pendientes (UNFULFILLED): ${ordersByStatus.UNFULFILLED.length}
• Esperando Stock: ${ordersByStatus.WAITING_STOCK.length}
• En Picking: ${ordersByStatus.PICKING.length}
• Empacados: ${ordersByStatus.PACKED.length}
• Enviados: ${ordersByStatus.SHIPPED.length}
• Entregados: ${ordersByStatus.DELIVERED.length}

**ÓRDENES DE COMPRA:**
• En Borrador (DRAFT): ${posByStatus.DRAFT.length}
${posByStatus.DRAFT.slice(0, 5).map(po => `  - ${po.order_number}: ${po.product_name} (${po.quantity} uds) - S/${po.total_amount}`).join('\n')}
• Enviadas (SENT): ${posByStatus.SENT.length}
• Confirmadas: ${posByStatus.CONFIRMED.length}
• En Tránsito: ${posByStatus.IN_TRANSIT.length}
• Recibidas: ${posByStatus.RECEIVED.length}

**ALERTAS DE INVENTARIO:**
• Productos agotados (Stock = 0): ${outOfStock.length}
${outOfStock.slice(0, 5).map(p => `  - ${p.nombre_producto} (${p.product_code})`).join('\n')}
• Productos críticos (Stock <= 5): ${criticalStock.length}
${criticalStock.slice(0, 5).map(p => `  - ${p.nombre_producto}: ${p.cantidad_stock} uds`).join('\n')}

**CANALES DE ORIGEN:**
• WhatsApp Manual: ${ordersBySource.whatsapp_manual.length} pedidos
• Web Form: ${ordersBySource.web_form.length} pedidos

**PROVEEDORES ACTIVOS:** ${suppliers?.length || 0}
${suppliers?.slice(0, 3).map(s => `• ${s.name} (Lead time: ${s.lead_time_days} días)`).join('\n') || ''}

**VENDEDORES:** ${vendedores?.length || 0}
${vendedores?.map(v => `• ${v.nombre} - Pedidos asignados: ${v.pedidos_asignados || 0}`).join('\n') || ''}

═══════════════════════════════════════════════════════════════
🛠️ HERRAMIENTAS DISPONIBLES (USA CUANDO SEA NECESARIO)
═══════════════════════════════════════════════════════════════

1. **update_purchase_order_status** - Cambiar estado de una PO
   Ejemplo: Cambiar PO-2025-5004 de DRAFT a SENT

2. **update_sales_order_status** - Cambiar estado de un pedido
   Ejemplo: Marcar ORD-2025-0001 como SHIPPED

3. **create_purchase_order** - Crear nueva orden de compra
   Ejemplo: Crear PO para reabastecer producto agotado

4. **update_product_stock** - Ajustar stock de un producto
   Ejemplo: Ajustar stock después de conteo físico

═══════════════════════════════════════════════════════════════
📋 INSTRUCCIONES
═══════════════════════════════════════════════════════════════
1. Responde SIEMPRE en español
2. Usa **negritas** y emojis para organizar la información
3. Cuando te pidan ejecutar una acción, USA LAS HERRAMIENTAS - no solo describas
4. Después de ejecutar una acción, confirma el resultado al usuario
5. Si hay errores, explícalos claramente
`;

    console.log('Calling Lovable AI with tools...');
    
    // First call - AI decides if it needs to use tools
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: question }
        ],
        tools: agentTools,
        tool_choice: "auto"
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Límite de peticiones excedido. Por favor, espera un momento e intenta de nuevo.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos de IA agotados. Por favor, recarga en la configuración de tu workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const firstChoice = aiData.choices?.[0];
    
    console.log('AI Response:', JSON.stringify(firstChoice, null, 2));

    // Check if AI wants to use tools
    if (firstChoice?.message?.tool_calls && firstChoice.message.tool_calls.length > 0) {
      console.log('AI wants to use tools, executing...');
      
      const toolResults: string[] = [];
      
      for (const toolCall of firstChoice.message.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs;
        
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error('Error parsing tool arguments:', e);
          toolResults.push(`❌ Error parseando argumentos para ${toolName}`);
          continue;
        }
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        const result = await executeToolAction(supabase, toolName, toolArgs);
        toolResults.push(result.message);
      }
      
      // Make a second call to get the final response with tool results
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: question },
            { role: 'assistant', content: firstChoice.message.content || '', tool_calls: firstChoice.message.tool_calls },
            { role: 'tool', content: toolResults.join('\n\n'), tool_call_id: firstChoice.message.tool_calls[0].id }
          ],
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        const finalAnswer = followUpData.choices?.[0]?.message?.content || toolResults.join('\n\n');
        
        return new Response(JSON.stringify({ 
          answer: finalAnswer,
          actions_executed: toolResults
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // If follow-up fails, return the tool results directly
      return new Response(JSON.stringify({ 
        answer: `He ejecutado las siguientes acciones:\n\n${toolResults.join('\n\n')}`,
        actions_executed: toolResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No tools needed, return the direct response
    const answer = firstChoice?.message?.content || 'No pude generar una respuesta.';
    
    console.log('AI Response received, length:', answer.length);

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in inventory-ai-agent:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error desconocido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
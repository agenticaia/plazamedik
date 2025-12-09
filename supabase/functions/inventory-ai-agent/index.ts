import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Fetching business data...');

    // Fetch all relevant data from database
    const [
      { data: products },
      { data: suppliers },
      { data: vendors },
      { data: salesOrders },
      { data: salesOrderItems },
      { data: purchaseOrders },
      { data: purchaseOrderItems },
      { data: customers },
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
        .limit(100),
      supabase.from('sales_order_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('purchase_order_items').select('*').limit(200),
      supabase.from('customers').select('*').order('total_spent', { ascending: false }).limit(50),
      supabase.rpc('get_low_stock_products', { p_threshold: 20 }),
      supabase.rpc('get_dashboard_metrics'),
    ]);

    console.log('Data fetched - Products:', products?.length, 'POs:', purchaseOrders?.length, 'SOs:', salesOrders?.length);

    // Calculate analytics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Today's sales
    const todayOrders = salesOrders?.filter(o => new Date(o.created_at) >= todayStart) || [];
    const todaySalesTotal = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    
    // Month sales
    const monthOrders = salesOrders?.filter(o => new Date(o.created_at) >= monthStart) || [];
    const monthSalesTotal = monthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Last 30 days
    const last30DaysOrders = salesOrders?.filter(o => new Date(o.created_at) >= last30Days) || [];
    const last30DaysSales = last30DaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Inventory value
    const inventoryValue = products?.reduce((sum, p) => 
      sum + (Number(p.precio || 0) * (p.cantidad_stock || 0)), 0
    ) || 0;

    // Products with ROP alerts
    const ropAlerts = products?.filter(p => 
      p.ai_reorder_point && p.cantidad_stock !== null && p.cantidad_stock <= p.ai_reorder_point
    ) || [];

    // Critical stock (out of stock or very low)
    const criticalStock = products?.filter(p => 
      p.cantidad_stock !== null && p.cantidad_stock <= 5
    ) || [];

    // Auto-generated POs
    const autoPOs = purchaseOrders?.filter(po => po.order_type === 'automatica') || [];
    const draftPOs = purchaseOrders?.filter(po => po.status === 'DRAFT') || [];
    const pendingPOs = purchaseOrders?.filter(po => ['SENT', 'PARTIAL_RECEIVED'].includes(po.status || '')) || [];

    // Top selling products from sales_order_items
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    salesOrderItems?.forEach(item => {
      const current = productSalesMap.get(item.product_code) || { 
        name: item.product_name, 
        quantity: 0, 
        revenue: 0 
      };
      productSalesMap.set(item.product_code, {
        name: item.product_name,
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + (item.quantity * Number(item.unit_price))
      });
    });
    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Supplier balances from POs
    const supplierBalances = new Map<string, { name: string; pending: number; total: number }>();
    purchaseOrders?.forEach(po => {
      const supplier = suppliers?.find(s => s.id === po.supplier_id) || vendors?.find(v => v.id === po.vendor_id);
      const supplierName = supplier?.name || 'Desconocido';
      const current = supplierBalances.get(po.supplier_id) || { name: supplierName, pending: 0, total: 0 };
      
      const balance = Number(po.total_cost || po.total_amount || 0) - Number(po.advance_payment_amount || 0);
      if (po.payment_status !== 'PAID') {
        current.pending += balance;
      }
      current.total += Number(po.total_cost || po.total_amount || 0);
      supplierBalances.set(po.supplier_id, current);
    });

    // Build comprehensive context for AI
    const context = `
Eres el Asistente IA de Inventario de PlazaMedik, un sistema ERP inteligente.
Tienes acceso COMPLETO a todos los datos del negocio en tiempo real.
Fecha y hora actual: ${now.toLocaleString('es-PE', { timeZone: 'America/Lima' })}

═══════════════════════════════════════════════════════════════
📊 RESUMEN EJECUTIVO - KPIs PRINCIPALES
═══════════════════════════════════════════════════════════════
${dashboardMetrics ? `
• Total Productos Activos: ${(dashboardMetrics as any).total_productos || products?.length || 0}
• Valor del Inventario: S/ ${inventoryValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• Stock Total: ${(dashboardMetrics as any).total_stock || 0} unidades
• Productos Vendidos (histórico): ${(dashboardMetrics as any).total_vendido || 0} unidades
• Ingresos Históricos Totales: S/ ${((dashboardMetrics as any).total_ingresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• Vistas Totales del Catálogo: ${(dashboardMetrics as any).total_views || 0}
• Productos con Stock Bajo: ${(dashboardMetrics as any).productos_bajo_stock || 0}
• Productos Agotados: ${(dashboardMetrics as any).productos_agotados || 0}
• Tasa de Conversión Promedio: ${((dashboardMetrics as any).conversion_rate_promedio || 0).toFixed(2)}%
` : 'Métricas no disponibles'}

═══════════════════════════════════════════════════════════════
💰 ANÁLISIS DE VENTAS
═══════════════════════════════════════════════════════════════
📅 VENTAS HOY:
• Total: S/ ${todaySalesTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• Pedidos: ${todayOrders.length}
• Promedio por pedido: S/ ${(todayOrders.length > 0 ? todaySalesTotal / todayOrders.length : 0).toFixed(2)}

📅 VENTAS ESTE MES:
• Total: S/ ${monthSalesTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• Pedidos: ${monthOrders.length}

📅 ÚLTIMOS 30 DÍAS:
• Total: S/ ${last30DaysSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• Pedidos: ${last30DaysOrders.length}

🏆 TOP 10 PRODUCTOS MÁS VENDIDOS:
${topSellingProducts.map((p, i) => `${i + 1}. ${p.name}
   • Unidades vendidas: ${p.quantity}
   • Ingresos: S/ ${p.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`).join('\n') || 'Sin datos de ventas'}

═══════════════════════════════════════════════════════════════
🎯 PUNTO DE REORDEN (ROP) - CALCULADORA IA
═══════════════════════════════════════════════════════════════
Fórmula: ROP = (Demanda durante Lead Time) + (Stock de Seguridad)
Usa los últimos 90 días de ventas para predecir cuándo ordenar.

🚨 PRODUCTOS QUE NECESITAN REORDEN (${ropAlerts.length}):
${ropAlerts.slice(0, 10).map(p => `• ${p.nombre_producto} (${p.product_code})
  - Stock actual: ${p.cantidad_stock} unidades
  - ROP (IA): ${p.ai_reorder_point} unidades
  - ALERTA: Stock por debajo del punto de reorden
  - Velocidad venta 7d: ${p.sales_velocity_7d || 0} uds/día`).join('\n') || 'Todos los productos tienen stock adecuado'}

═══════════════════════════════════════════════════════════════
⚠️ ALERTAS CRÍTICAS DE STOCK
═══════════════════════════════════════════════════════════════
${criticalStock.length > 0 ? `
🔴 ${criticalStock.length} PRODUCTOS EN ESTADO CRÍTICO:
${criticalStock.slice(0, 10).map(p => `• ${p.nombre_producto} (${p.product_code})
  - Stock: ${p.cantidad_stock} unidades
  - ROP: ${p.ai_reorder_point || p.reorder_point || 'No definido'}
  - Días de cobertura: ${p.sales_velocity_7d && p.sales_velocity_7d > 0 
    ? Math.floor((p.cantidad_stock || 0) / p.sales_velocity_7d) 
    : 'N/A'} días`).join('\n')}` : '✅ No hay productos en estado crítico'}

${lowStockProducts && lowStockProducts.length > 0 ? `
🟡 PRODUCTOS CON STOCK BAJO (${lowStockProducts.length}):
${lowStockProducts.slice(0, 10).map((p: any) => `• ${p.nombre_producto} (${p.product_code})
  - Stock: ${p.cantidad_stock} | Demanda diaria: ${p.demanda_diaria?.toFixed(2) || 0}
  - Días hasta agotamiento: ${p.dias_restantes}`).join('\n')}` : ''}

═══════════════════════════════════════════════════════════════
🛒 ÓRDENES DE COMPRA - FLUJOS
═══════════════════════════════════════════════════════════════
📊 RESUMEN:
• Total POs activas: ${purchaseOrders?.length || 0}
• POs Auto-generadas (IA): ${autoPOs.length}
• POs en Borrador: ${draftPOs.length}
• POs Pendientes/En Tránsito: ${pendingPOs.length}

🤖 POs AUTO-GENERADAS POR TRIGGER ROP:
${autoPOs.slice(0, 5).map(po => `• ${po.order_number} - ${po.product_name}
  - Estado: ${po.status}
  - Cantidad: ${po.quantity} unidades
  - Total: S/ ${Number(po.total_amount || 0).toFixed(2)}
  - Tipo: ${po.po_type}
  - Prioridad: ${po.priority}`).join('\n') || 'No hay POs automáticas'}

📋 TIPOS DE FLUJOS DE ÓRDENES DE COMPRA:
1. STOCK_REPLENISHMENT: Reposición de stock normal
2. BACKORDER_FULFILLMENT: Para cumplir pedidos sin stock (Cross-docking)
3. URGENT: Reposición urgente por stock crítico

═══════════════════════════════════════════════════════════════
🏢 PROVEEDORES Y BALANCES
═══════════════════════════════════════════════════════════════
${suppliers && suppliers.length > 0 ? `
Proveedores activos: ${suppliers.length}
${suppliers.map(s => `• ${s.name}
  - Lead time: ${s.lead_time_days || 7} días
  - Rating: ${s.rating || 'N/A'}/5
  - Términos pago: ${s.payment_terms || 'No especificado'}`).join('\n')}` : 'No hay proveedores registrados'}

💳 BALANCES PENDIENTES DE PAGO:
${Array.from(supplierBalances.values())
  .filter(s => s.pending > 0)
  .map(s => `• ${s.name}: S/ ${s.pending.toLocaleString('es-PE', { minimumFractionDigits: 2 })} pendiente`)
  .join('\n') || 'No hay pagos pendientes'}

═══════════════════════════════════════════════════════════════
📦 INVENTARIO COMPLETO (${products?.length || 0} productos activos)
═══════════════════════════════════════════════════════════════
${products?.slice(0, 20).map(p => {
  const stockStatus = (p.cantidad_stock || 0) === 0 ? '🔴 AGOTADO' :
    (p.cantidad_stock || 0) <= 5 ? '🟠 CRÍTICO' :
    (p.cantidad_stock || 0) <= (p.ai_reorder_point || 20) ? '🟡 BAJO' : '🟢 OK';
  
  return `• ${p.nombre_producto} (${p.product_code})
  - Stock: ${p.cantidad_stock} uds ${stockStatus}
  - Precio: S/ ${Number(p.precio || 0).toFixed(2)}
  - ROP (IA): ${p.ai_reorder_point || 'No calculado'}
  - Vendidos: ${p.total_vendido || 0} | Vistas: ${p.total_views || 0}`;
}).join('\n') || 'No hay productos'}

═══════════════════════════════════════════════════════════════
👥 CLIENTES TOP
═══════════════════════════════════════════════════════════════
${customers?.slice(0, 5).map((c, i) => `${i + 1}. ${c.name} ${c.lastname || ''}
   - Total gastado: S/ ${Number(c.total_spent || 0).toFixed(2)}
   - Pedidos: ${c.total_orders || 0}
   - Tipo: ${c.customer_type || 'REGULAR'}`).join('\n') || 'Sin datos de clientes'}

═══════════════════════════════════════════════════════════════
📋 INSTRUCCIONES PARA EL ASISTENTE
═══════════════════════════════════════════════════════════════
1. Responde SIEMPRE en español con tono profesional y amigable
2. Usa emojis para organizar visualmente la información
3. Incluye datos específicos: nombres, cantidades, precios exactos
4. Para alertas de stock, siempre menciona:
   - Stock actual vs ROP
   - Días estimados de cobertura
   - Acción recomendada
5. Para ventas, compara con períodos anteriores cuando sea posible
6. Si detectas anomalías, menciónalas proactivamente
7. Ofrece insights adicionales basados en los datos
8. Si el usuario pregunta por navegación, puedes sugerir las secciones del admin:
   - Dashboard: Vista ERP unificada
   - Ejecutivo Analytics: KPIs y análisis táctico
   - Estadísticas Ventas: Ingresos y tendencias
   - Pagos & Finanzas: Flujo de caja y proveedores
   - Productos: Gestión de catálogo
   - Órdenes de Compra: Procure to Pay
   - Punto Reorden IA: Calculadora ROP
   - Predicción IA: Smart Inventory Dashboard

💡 CAPACIDADES ESPECIALES:
- Análisis de rentabilidad por producto
- Predicciones de reabastecimiento inteligentes
- Identificación de productos sin movimiento
- Comparativas temporales (día/semana/mes)
- Cross-docking y backorder tracking
- Alertas proactivas de ROP
`;

    console.log('Calling Lovable AI...');
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

      throw new Error('AI gateway error: ' + errorText);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
    
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

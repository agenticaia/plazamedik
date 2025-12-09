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
      { data: pedidosWaLog },
      { data: orderStateLog },
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
      supabase.from('pedidos_wa_log')
        .select('*')
        .order('timestamp_evento', { ascending: false })
        .limit(100),
      supabase.from('order_state_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200),
      supabase.rpc('get_low_stock_products', { p_threshold: 20 }),
      supabase.rpc('get_dashboard_metrics'),
    ]);

    console.log('Data fetched - Products:', products?.length, 'SOs:', salesOrders?.length, 'WA Messages:', waMessagesLog?.length, 'Vendedores:', vendedores?.length);

    // Calculate comprehensive analytics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ==================== ORDERS ANALYTICS ====================
    // Today's orders
    const todayOrders = salesOrders?.filter(o => new Date(o.created_at) >= todayStart) || [];
    const todaySalesTotal = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    
    // Month orders
    const monthOrders = salesOrders?.filter(o => new Date(o.created_at) >= monthStart) || [];
    const monthSalesTotal = monthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Last 30 days
    const last30DaysOrders = salesOrders?.filter(o => new Date(o.created_at) >= last30Days) || [];
    const last30DaysSales = last30DaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // ==================== ORDER STATUS ANALYTICS ====================
    const ordersByStatus = {
      UNFULFILLED: salesOrders?.filter(o => o.fulfillment_status === 'UNFULFILLED') || [],
      WAITING_STOCK: salesOrders?.filter(o => o.fulfillment_status === 'WAITING_STOCK') || [],
      PICKING: salesOrders?.filter(o => o.fulfillment_status === 'PICKING') || [],
      PACKED: salesOrders?.filter(o => o.fulfillment_status === 'PACKED') || [],
      SHIPPED: salesOrders?.filter(o => o.fulfillment_status === 'SHIPPED') || [],
      DELIVERED: salesOrders?.filter(o => o.fulfillment_status === 'DELIVERED') || [],
    };

    // ==================== DELIVERED ORDERS (Last 30 days) ====================
    const deliveredOrders = salesOrders?.filter(o => 
      o.fulfillment_status === 'DELIVERED' && 
      o.delivered_at && 
      new Date(o.delivered_at) >= last30Days
    ) || [];

    // ==================== PAYMENT STATUS ====================
    const ordersByPayment = {
      PENDING: salesOrders?.filter(o => o.payment_status === 'PENDING') || [],
      PAID: salesOrders?.filter(o => o.payment_status === 'PAID') || [],
      PARTIAL: salesOrders?.filter(o => o.payment_status === 'PARTIAL') || [],
    };

    // ==================== SOURCE/CHANNEL ANALYTICS ====================
    const ordersBySource = {
      whatsapp_manual: salesOrders?.filter(o => o.ruta === 'whatsapp_manual' || o.source === 'whatsapp_manual') || [],
      web_form: salesOrders?.filter(o => o.ruta === 'web_form' || o.source === 'web_form' || !o.ruta) || [],
    };

    const sourceAnalysis = {
      whatsapp: {
        total: ordersBySource.whatsapp_manual.length,
        revenue: ordersBySource.whatsapp_manual.reduce((sum, o) => sum + Number(o.total || 0), 0),
        avgTicket: ordersBySource.whatsapp_manual.length > 0 
          ? ordersBySource.whatsapp_manual.reduce((sum, o) => sum + Number(o.total || 0), 0) / ordersBySource.whatsapp_manual.length 
          : 0
      },
      web: {
        total: ordersBySource.web_form.length,
        revenue: ordersBySource.web_form.reduce((sum, o) => sum + Number(o.total || 0), 0),
        avgTicket: ordersBySource.web_form.length > 0 
          ? ordersBySource.web_form.reduce((sum, o) => sum + Number(o.total || 0), 0) / ordersBySource.web_form.length 
          : 0
      }
    };

    // ==================== VENDEDORES/SELLERS ANALYTICS ====================
    const vendedorStats = new Map<string, { name: string; orders: number; revenue: number; delivered: number; pending: number }>();
    
    salesOrders?.forEach(order => {
      if (order.asignado_a_vendedor_id || order.asignado_a_vendedor_nombre) {
        const vendorId = order.asignado_a_vendedor_id || 'unknown';
        const vendorName = order.asignado_a_vendedor_nombre || 'Sin nombre';
        const current = vendedorStats.get(vendorId) || { name: vendorName, orders: 0, revenue: 0, delivered: 0, pending: 0 };
        
        current.orders += 1;
        current.revenue += Number(order.total || 0);
        
        if (order.fulfillment_status === 'DELIVERED') {
          current.delivered += 1;
        } else if (['UNFULFILLED', 'PICKING', 'WAITING_STOCK'].includes(order.fulfillment_status || '')) {
          current.pending += 1;
        }
        
        vendedorStats.set(vendorId, current);
      }
    });

    // ==================== WHATSAPP NOTIFICATIONS ANALYTICS ====================
    const waMessageStats = {
      total: waMessagesLog?.length || 0,
      sent: waMessagesLog?.filter(m => m.status === 'sent' || m.timestamp_sent)?.length || 0,
      delivered: waMessagesLog?.filter(m => m.status === 'delivered' || m.timestamp_delivered)?.length || 0,
      read: waMessagesLog?.filter(m => m.status === 'read' || m.timestamp_read)?.length || 0,
      failed: waMessagesLog?.filter(m => m.status === 'failed' || m.error_message)?.length || 0,
    };

    // Recent WA messages with status
    const recentWaMessages = waMessagesLog?.slice(0, 10).map(m => ({
      phone: m.phone_number,
      type: m.message_type,
      status: m.status,
      sentAt: m.timestamp_sent,
      orderId: m.sales_order_id,
    })) || [];

    // ==================== CROSS-DOCKING & BACKORDER ====================
    const backorderItems = salesOrderItems?.filter(item => item.is_backorder) || [];
    const crossDockingOrders = salesOrders?.filter(o => o.fulfillment_status === 'WAITING_STOCK') || [];
    
    // POs linked to sales orders (cross-docking)
    const crossDockingPOs = purchaseOrders?.filter(po => po.linked_sales_order_id) || [];

    // ==================== INVENTORY ANALYTICS ====================
    const inventoryValue = products?.reduce((sum, p) => 
      sum + (Number(p.precio || 0) * (p.cantidad_stock || 0)), 0
    ) || 0;

    const ropAlerts = products?.filter(p => 
      p.ai_reorder_point && p.cantidad_stock !== null && p.cantidad_stock <= p.ai_reorder_point
    ) || [];

    const criticalStock = products?.filter(p => 
      p.cantidad_stock !== null && p.cantidad_stock <= 5
    ) || [];

    const outOfStock = products?.filter(p => 
      p.cantidad_stock !== null && p.cantidad_stock === 0
    ) || [];

    // ==================== PO ANALYTICS ====================
    const autoPOs = purchaseOrders?.filter(po => po.order_type === 'automatica') || [];
    const draftPOs = purchaseOrders?.filter(po => po.status === 'DRAFT') || [];
    const pendingPOs = purchaseOrders?.filter(po => ['SENT', 'PARTIAL_RECEIVED', 'IN_TRANSIT'].includes(po.status || '')) || [];

    // ==================== TOP PRODUCTS ====================
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

    // ==================== CUSTOMERS ANALYTICS ====================
    const topCustomers = customers?.slice(0, 10) || [];
    const newCustomersThisMonth = customers?.filter(c => 
      c.created_at && new Date(c.created_at) >= monthStart
    ) || [];

    // ==================== DELIVERY TIME ANALYTICS ====================
    const deliveryTimes = deliveredOrders.map(order => {
      if (order.created_at && order.delivered_at) {
        const created = new Date(order.created_at);
        const delivered = new Date(order.delivered_at);
        return (delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      }
      return null;
    }).filter(t => t !== null) as number[];
    
    const avgDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length 
      : 0;

    // Build comprehensive context for AI
    const context = `
Eres el **Asistente IA de Inventario y Operaciones** de PlazaMedik, un sistema ERP inteligente con acceso COMPLETO a todos los datos del negocio.
Fecha y hora actual: ${now.toLocaleString('es-PE', { timeZone: 'America/Lima' })}

═══════════════════════════════════════════════════════════════
📊 RESUMEN EJECUTIVO - KPIs PRINCIPALES
═══════════════════════════════════════════════════════════════
${dashboardMetrics ? `
• **Total Productos Activos:** ${(dashboardMetrics as any).total_productos || products?.length || 0}
• **Valor del Inventario:** S/ ${inventoryValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• **Stock Total:** ${(dashboardMetrics as any).total_stock || 0} unidades
• **Productos Vendidos (histórico):** ${(dashboardMetrics as any).total_vendido || 0} unidades
• **Ingresos Históricos Totales:** S/ ${((dashboardMetrics as any).total_ingresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• **Productos con Stock Bajo:** ${(dashboardMetrics as any).productos_bajo_stock || 0}
• **Productos Agotados:** ${outOfStock.length}
• **Tasa de Conversión:** ${((dashboardMetrics as any).conversion_rate_promedio || 0).toFixed(2)}%
` : 'Métricas no disponibles'}

═══════════════════════════════════════════════════════════════
💰 ANÁLISIS DE VENTAS
═══════════════════════════════════════════════════════════════
📅 **VENTAS HOY:**
• Total: **S/ ${todaySalesTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}**
• Pedidos: ${todayOrders.length}
• Promedio por pedido: S/ ${(todayOrders.length > 0 ? todaySalesTotal / todayOrders.length : 0).toFixed(2)}

📅 **VENTAS ESTE MES:**
• Total: **S/ ${monthSalesTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}**
• Pedidos: ${monthOrders.length}

📅 **ÚLTIMOS 30 DÍAS:**
• Total: S/ ${last30DaysSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
• Pedidos: ${last30DaysOrders.length}

🏆 **TOP 10 PRODUCTOS MÁS VENDIDOS:**
${topSellingProducts.map((p, i) => `${i + 1}. **${p.name}**
   • Unidades vendidas: ${p.quantity}
   • Ingresos: S/ ${p.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`).join('\n') || 'Sin datos de ventas'}

═══════════════════════════════════════════════════════════════
📦 GESTIÓN DE PEDIDOS - ESTADO OPERATIVO
═══════════════════════════════════════════════════════════════
📊 **RESUMEN POR ESTADO:**
• 🔴 **Pendientes (UNFULFILLED):** ${ordersByStatus.UNFULFILLED.length} pedidos
• 🟠 **Esperando Stock (WAITING_STOCK):** ${ordersByStatus.WAITING_STOCK.length} pedidos (Cross-docking activo)
• 🟡 **En Picking:** ${ordersByStatus.PICKING.length} pedidos
• 🟢 **Empacados (PACKED):** ${ordersByStatus.PACKED.length} pedidos
• 📦 **Enviados (SHIPPED):** ${ordersByStatus.SHIPPED.length} pedidos
• ✅ **Entregados (DELIVERED):** ${ordersByStatus.DELIVERED.length} pedidos

📊 **ESTADO DE PAGOS:**
• ⏳ Pendientes de pago: ${ordersByPayment.PENDING.length} (S/ ${ordersByPayment.PENDING.reduce((s, o) => s + Number(o.total || 0), 0).toFixed(2)})
• ✅ Pagados: ${ordersByPayment.PAID.length} (S/ ${ordersByPayment.PAID.reduce((s, o) => s + Number(o.total || 0), 0).toFixed(2)})
• 🔄 Pago parcial: ${ordersByPayment.PARTIAL.length}

═══════════════════════════════════════════════════════════════
✅ PEDIDOS ENTREGADOS (Últimos 30 días)
═══════════════════════════════════════════════════════════════
• **Total entregados:** ${deliveredOrders.length} pedidos
• **Tiempo promedio de entrega:** ${avgDeliveryTime.toFixed(1)} días
• **Valor total entregado:** S/ ${deliveredOrders.reduce((s, o) => s + Number(o.total || 0), 0).toFixed(2)}

📋 **ÚLTIMOS PEDIDOS ENTREGADOS:**
${deliveredOrders.slice(0, 5).map(o => `• **${o.order_number}** - ${o.customer_name}
  - Entregado: ${o.delivered_at ? new Date(o.delivered_at).toLocaleDateString('es-PE') : 'N/A'}
  - Total: S/ ${Number(o.total || 0).toFixed(2)}
  - Distrito: ${o.customer_district || 'N/A'}`).join('\n') || 'No hay entregas recientes'}

📝 **CRITERIOS DE ENTREGA:**
Un pedido se considera "ENTREGADO" cuando:
1. El courier confirma la entrega física al cliente
2. El administrador actualiza el estado a DELIVERED en el sistema
3. Se registra el timestamp \`delivered_at\`
4. Se guarda el evento en \`order_state_log\`

═══════════════════════════════════════════════════════════════
📱 ANÁLISIS POR CANAL DE ORIGEN
═══════════════════════════════════════════════════════════════
📲 **WHATSAPP MANUAL:**
• Pedidos: ${sourceAnalysis.whatsapp.total}
• Ingresos: S/ ${sourceAnalysis.whatsapp.revenue.toFixed(2)}
• Ticket promedio: S/ ${sourceAnalysis.whatsapp.avgTicket.toFixed(2)}
• % del total: ${salesOrders?.length ? ((sourceAnalysis.whatsapp.total / salesOrders.length) * 100).toFixed(1) : 0}%

🌐 **WEB FORM:**
• Pedidos: ${sourceAnalysis.web.total}
• Ingresos: S/ ${sourceAnalysis.web.revenue.toFixed(2)}
• Ticket promedio: S/ ${sourceAnalysis.web.avgTicket.toFixed(2)}
• % del total: ${salesOrders?.length ? ((sourceAnalysis.web.total / salesOrders.length) * 100).toFixed(1) : 0}%

📊 **CANAL MÁS USADO:** ${sourceAnalysis.whatsapp.total > sourceAnalysis.web.total ? '📲 WhatsApp Manual' : '🌐 Web Form'} (${Math.max(sourceAnalysis.whatsapp.total, sourceAnalysis.web.total)} pedidos)

═══════════════════════════════════════════════════════════════
👨‍💼 VENDEDORES Y ASIGNACIONES
═══════════════════════════════════════════════════════════════
📊 **VENDEDORES ACTIVOS:** ${vendedores?.filter(v => v.is_active)?.length || 0}

${Array.from(vendedorStats.values()).map((v, i) => `${i + 1}. **${v.name}**
   • Pedidos asignados: ${v.orders}
   • Ingresos generados: S/ ${v.revenue.toFixed(2)}
   • Entregados: ${v.delivered} | Pendientes: ${v.pending}`).join('\n') || 'No hay datos de vendedores'}

📋 **LISTA DE VENDEDORES:**
${vendedores?.map(v => `• **${v.nombre}** (${v.email})
  - Activo: ${v.is_active ? '✅ Sí' : '❌ No'}
  - Teléfono: ${v.telefono || 'N/A'}
  - Pedidos asignados: ${v.pedidos_asignados || 0}`).join('\n') || 'No hay vendedores registrados'}

═══════════════════════════════════════════════════════════════
📲 NOTIFICACIONES WHATSAPP - STATUS
═══════════════════════════════════════════════════════════════
📊 **RESUMEN DE MENSAJES:**
• Total enviados: ${waMessageStats.total}
• ✅ Entregados: ${waMessageStats.delivered}
• 👀 Leídos: ${waMessageStats.read}
• ❌ Fallidos: ${waMessageStats.failed}
• Tasa de entrega: ${waMessageStats.total > 0 ? ((waMessageStats.delivered / waMessageStats.total) * 100).toFixed(1) : 0}%

📋 **ÚLTIMOS MENSAJES WA:**
${recentWaMessages.map(m => `• 📱 ${m.phone} - ${m.type || 'mensaje'}
  - Estado: ${m.status || 'enviado'}
  - Enviado: ${m.sentAt ? new Date(m.sentAt).toLocaleString('es-PE') : 'N/A'}`).join('\n') || 'No hay mensajes recientes'}

═══════════════════════════════════════════════════════════════
🔄 CROSS-DOCKING & BACKORDERS
═══════════════════════════════════════════════════════════════
📦 **PEDIDOS EN CROSS-DOCKING:** ${crossDockingOrders.length}
${crossDockingOrders.slice(0, 5).map(o => `• **${o.order_number}** - ${o.customer_name}
  - Estado: WAITING_STOCK
  - Total: S/ ${Number(o.total || 0).toFixed(2)}`).join('\n') || 'No hay pedidos en cross-docking'}

🔗 **POs VINCULADAS (Para Cross-docking):** ${crossDockingPOs.length}
${crossDockingPOs.slice(0, 5).map(po => `• **${po.order_number}** → SO vinculada
  - Producto: ${po.product_name}
  - Estado: ${po.status}
  - Cantidad: ${po.quantity}`).join('\n') || 'No hay POs vinculadas'}

📋 **ITEMS EN BACKORDER:** ${backorderItems.length}
${backorderItems.slice(0, 5).map(item => `• ${item.product_name} (${item.product_code})
  - Cantidad: ${item.quantity}
  - PO vinculada: ${item.linked_purchase_order_id ? '✅ Sí' : '❌ No'}`).join('\n') || 'No hay items en backorder'}

═══════════════════════════════════════════════════════════════
🎯 PUNTO DE REORDEN (ROP) - CALCULADORA IA
═══════════════════════════════════════════════════════════════
Fórmula: **ROP = (Demanda × Lead Time) + Safety Stock**

🚨 **PRODUCTOS QUE NECESITAN REORDEN (${ropAlerts.length}):**
${ropAlerts.slice(0, 10).map(p => `• **${p.nombre_producto}** (${p.product_code})
  - Stock actual: ${p.cantidad_stock} unidades
  - ROP (IA): ${p.ai_reorder_point} unidades
  - ⚠️ ALERTA: Stock por debajo del punto de reorden`).join('\n') || '✅ Todos los productos tienen stock adecuado'}

═══════════════════════════════════════════════════════════════
⚠️ ALERTAS CRÍTICAS DE STOCK
═══════════════════════════════════════════════════════════════
${criticalStock.length > 0 ? `
🔴 **${criticalStock.length} PRODUCTOS EN ESTADO CRÍTICO:**
${criticalStock.slice(0, 10).map(p => `• **${p.nombre_producto}** (${p.product_code})
  - Stock: ${p.cantidad_stock} unidades
  - ROP: ${p.ai_reorder_point || p.reorder_point || 'No definido'}`).join('\n')}` : '✅ No hay productos en estado crítico'}

${outOfStock.length > 0 ? `
🔴 **${outOfStock.length} PRODUCTOS AGOTADOS (Stock = 0):**
${outOfStock.slice(0, 5).map(p => `• **${p.nombre_producto}** (${p.product_code})`).join('\n')}` : ''}

═══════════════════════════════════════════════════════════════
🛒 ÓRDENES DE COMPRA - FLUJOS
═══════════════════════════════════════════════════════════════
📊 **RESUMEN:**
• Total POs activas: ${purchaseOrders?.length || 0}
• POs Auto-generadas (IA): ${autoPOs.length}
• POs en Borrador: ${draftPOs.length}
• POs Pendientes/En Tránsito: ${pendingPOs.length}

🤖 **POs AUTO-GENERADAS POR ROP:**
${autoPOs.slice(0, 5).map(po => `• **${po.order_number}** - ${po.product_name}
  - Estado: ${po.status}
  - Cantidad: ${po.quantity} unidades
  - Tipo: ${po.po_type}
  - Prioridad: ${po.priority}`).join('\n') || 'No hay POs automáticas'}

📋 **TIPOS DE FLUJOS:**
1. **STOCK_REPLENISHMENT:** Reposición de stock normal
2. **BACKORDER_FULFILLMENT:** Para cumplir pedidos sin stock (Cross-docking)
3. **URGENT:** Reposición urgente por stock crítico

═══════════════════════════════════════════════════════════════
👥 CLIENTES - ANÁLISIS
═══════════════════════════════════════════════════════════════
• **Total clientes:** ${customers?.length || 0}
• **Nuevos este mes:** ${newCustomersThisMonth.length}

🏆 **TOP 10 CLIENTES:**
${topCustomers.map((c, i) => `${i + 1}. **${c.name} ${c.lastname || ''}**
   - Total gastado: S/ ${Number(c.total_spent || 0).toFixed(2)}
   - Pedidos: ${c.total_orders || 0}
   - Tipo: ${c.customer_type || 'REGULAR'}
   - Distrito: ${c.district || 'N/A'}`).join('\n') || 'Sin datos de clientes'}

═══════════════════════════════════════════════════════════════
🏢 PROVEEDORES Y BALANCES
═══════════════════════════════════════════════════════════════
${suppliers && suppliers.length > 0 ? `
**Proveedores activos:** ${suppliers.length}
${suppliers.map(s => `• **${s.name}**
  - Lead time: ${s.lead_time_days || 7} días
  - Rating: ${s.rating || 'N/A'}/5
  - Términos pago: ${s.payment_terms || 'No especificado'}`).join('\n')}` : 'No hay proveedores registrados'}

═══════════════════════════════════════════════════════════════
📋 BASE DE CONOCIMIENTO - PROCESOS
═══════════════════════════════════════════════════════════════

**FLUJO DE PEDIDOS (SOP):**
1. **UNFULFILLED** → Pedido recibido, pendiente de procesamiento
2. **WAITING_STOCK** → Esperando reabastecimiento (Cross-docking activo)
3. **PICKING** → En proceso de recolección
4. **PACKED** → Empacado, listo para envío
5. **SHIPPED** → En tránsito al cliente
6. **DELIVERED** → Entregado exitosamente

**CROSS-DOCKING:**
- Sistema identifica cuando un pedido requiere items sin stock
- Se genera PO automática vinculada al pedido
- Al recibir la PO, se activa envío directo sin almacenar

**CRITERIO DE ENTREGA:**
- El pedido está "ENTREGADO" cuando el courier confirma entrega física
- Se actualiza \`fulfillment_status = 'DELIVERED'\`
- Se registra \`delivered_at\` con timestamp
- Se guarda en \`order_state_log\` para auditoría

═══════════════════════════════════════════════════════════════
📋 INSTRUCCIONES PARA EL ASISTENTE
═══════════════════════════════════════════════════════════════
1. Responde SIEMPRE en español con tono profesional y amigable
2. Usa **negritas** para destacar información importante
3. Usa emojis para organizar visualmente la información
4. Incluye datos específicos: nombres, cantidades, precios exactos
5. Para preguntas sobre entregas, usa la sección "PEDIDOS ENTREGADOS"
6. Para análisis de canales, compara WhatsApp vs Web Form
7. Para vendedores, muestra asignaciones y rendimiento
8. Si detectas anomalías, menciónalas proactivamente
9. Ofrece insights adicionales basados en los datos

💡 **CAPACIDADES ESPECIALES:**
- Análisis de rentabilidad por producto y canal
- Tracking de pedidos y estados de entrega
- Métricas de vendedores y asignaciones
- Cross-docking y backorder tracking
- Alertas de ROP e inventario
- Análisis de notificaciones WhatsApp
- Comparativas por canal de origen
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

      throw new Error('AI gateway error');
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

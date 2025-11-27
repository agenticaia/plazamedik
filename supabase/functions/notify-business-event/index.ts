import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessEventRequest {
  event_type: 'NEW_SALES_ORDER' | 'AUTO_PURCHASE_ORDER' | 'DRAFT_CREATED';
  event_data: any;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
  reason: string;
}

async function getBusinessMetrics(supabase: any) {
  const [productsRes, ordersRes, posRes, customersRes] = await Promise.all([
    supabase.from('products').select('cantidad_stock, ai_reorder_point, is_discontinued'),
    supabase.from('sales_orders').select('total, fulfillment_status, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('purchase_orders').select('status, total_amount, priority').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('customers').select('total_orders, total_spent, referral_credits'),
  ]);

  const products = productsRes.data || [];
  const orders = ordersRes.data || [];
  const pos = posRes.data || [];
  const customers = customersRes.data || [];

  const lowStockCount = products.filter(p => 
    !p.is_discontinued && p.cantidad_stock < (p.ai_reorder_point || 10)
  ).length;

  const outOfStockCount = products.filter(p => 
    !p.is_discontinued && p.cantidad_stock === 0
  ).length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.fulfillment_status !== 'DELIVERED').length;
  const draftPOs = pos.filter(p => p.status === 'DRAFT').length;
  const urgentPOs = pos.filter(p => p.priority === 'URGENT').length;

  const totalCustomers = customers.length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalReferralCredits = customers.reduce((sum, c) => sum + (c.referral_credits || 0), 0);

  return {
    inventory: {
      lowStockCount,
      outOfStockCount,
      totalProducts: products.length,
    },
    sales: {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      avgOrderValue,
    },
    procurement: {
      draftPOs,
      urgentPOs,
      totalPOs: pos.length,
    },
    customers: {
      totalCustomers,
      totalReferralCredits,
    },
  };
}

async function generateAICoachRecommendations(
  eventType: string,
  eventData: any,
  metrics: any,
  reason: string,
  urgency: string
): Promise<string> {
  const prompt = `Eres un AI Business Coach experto en e-commerce de productos médicos (PlazaMedik - medias de compresión).

EVENTO ACTUAL:
- Tipo: ${eventType}
- Urgencia: ${urgency}
- Motivo: ${reason}
- Detalles: ${JSON.stringify(eventData, null, 2)}

MÉTRICAS DEL NEGOCIO (últimos 30 días):
📦 INVENTARIO:
- Productos con stock bajo: ${metrics.inventory.lowStockCount}
- Productos agotados: ${metrics.inventory.outOfStockCount}
- Total productos: ${metrics.inventory.totalProducts}

💰 VENTAS:
- Ingresos totales: S/. ${metrics.sales.totalRevenue.toFixed(2)}
- Pedidos totales: ${metrics.sales.totalOrders}
- Pedidos pendientes: ${metrics.sales.pendingOrders}
- Valor promedio por pedido: S/. ${metrics.sales.avgOrderValue.toFixed(2)}

📋 PROCUREMENT:
- POs en borrador: ${metrics.procurement.draftPOs}
- POs urgentes: ${metrics.procurement.urgentPOs}
- Total POs: ${metrics.procurement.totalPOs}

👥 CLIENTES:
- Total clientes: ${metrics.customers.totalCustomers}
- Créditos de referidos: S/. ${metrics.customers.totalReferralCredits.toFixed(2)}

INSTRUCCIONES:
1. Analiza el evento actual en el contexto de las métricas del negocio
2. Identifica riesgos inmediatos y oportunidades
3. Proporciona 3-5 recomendaciones ACCIONABLES priorizadas
4. Sugiere próximos pasos específicos con timeline
5. Menciona KPIs a monitorear

Responde en español, de forma profesional pero concisa (máximo 300 palabras).`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un AI Business Coach experto en e-commerce." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return "No se pudo generar análisis IA en este momento.";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return "Error al generar recomendaciones IA.";
  }
}

function formatEventDetails(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'NEW_SALES_ORDER':
      return `
        <h3>📦 Nuevo Pedido Registrado</h3>
        <ul>
          <li><strong>Número de orden:</strong> ${eventData.order_number || 'N/A'}</li>
          <li><strong>Cliente:</strong> ${eventData.customer_name || 'N/A'}</li>
          <li><strong>Total:</strong> S/. ${eventData.total || 0}</li>
          <li><strong>Estado:</strong> ${eventData.fulfillment_status || 'UNFULFILLED'}</li>
          <li><strong>Pago:</strong> ${eventData.payment_status || 'PENDING'}</li>
        </ul>
      `;
    case 'AUTO_PURCHASE_ORDER':
      return `
        <h3>🤖 Orden de Compra Automática Generada</h3>
        <ul>
          <li><strong>Número PO:</strong> ${eventData.order_number || 'N/A'}</li>
          <li><strong>Producto:</strong> ${eventData.product_name || 'N/A'}</li>
          <li><strong>Cantidad:</strong> ${eventData.quantity || 0} unidades</li>
          <li><strong>Proveedor:</strong> ${eventData.supplier_name || 'N/A'}</li>
          <li><strong>Prioridad:</strong> ${eventData.priority || 'NORMAL'}</li>
          <li><strong>Tipo:</strong> ${eventData.po_type || 'N/A'}</li>
        </ul>
      `;
    case 'DRAFT_CREATED':
      return `
        <h3>📝 Estado en Borrador Creado</h3>
        <ul>
          <li><strong>Módulo:</strong> ${eventData.module || 'N/A'}</li>
          <li><strong>Referencia:</strong> ${eventData.reference || 'N/A'}</li>
          <li><strong>Detalles:</strong> ${eventData.details || 'N/A'}</li>
        </ul>
      `;
    default:
      return `<pre>${JSON.stringify(eventData, null, 2)}</pre>`;
  }
}

function getUrgencyBadge(urgency: string): string {
  const badges = {
    URGENT: '🔴 URGENTE',
    HIGH: '🟠 ALTA',
    MEDIUM: '🟡 MEDIA',
    LOW: '🟢 BAJA',
  };
  return badges[urgency as keyof typeof badges] || urgency;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      event_type,
      event_data,
      urgency,
      created_at,
      reason,
    }: BusinessEventRequest = await req.json();

    console.log("Processing business event:", event_type);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current business metrics
    const metrics = await getBusinessMetrics(supabase);

    // Generate AI Coach recommendations
    const aiRecommendations = await generateAICoachRecommendations(
      event_type,
      event_data,
      metrics,
      reason,
      urgency
    );

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .urgency-badge {
              display: inline-block;
              padding: 8px 16px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 20px;
              font-weight: bold;
              margin-top: 10px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
            }
            .event-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .ai-section {
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
              border: 2px solid #667eea;
            }
            .ai-section h2 {
              color: #667eea;
              margin-top: 0;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .metric-card {
              background: white;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .metric-card h4 {
              margin: 0 0 10px 0;
              color: #667eea;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            ul {
              padding-left: 20px;
            }
            .ai-recommendations {
              white-space: pre-wrap;
              line-height: 1.8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 PlazaMedik Business Alert</h1>
            <p>Notificación del Sistema</p>
            <div class="urgency-badge">${getUrgencyBadge(urgency)}</div>
          </div>
          
          <div class="content">
            <p><strong>📅 Fecha:</strong> ${new Date(created_at).toLocaleString('es-PE')}</p>
            <p><strong>🎯 Motivo:</strong> ${reason}</p>
            
            <div class="event-details">
              ${formatEventDetails(event_type, event_data)}
            </div>

            <div class="metrics-grid">
              <div class="metric-card">
                <h4>📦 Inventario</h4>
                <p>Stock bajo: <strong>${metrics.inventory.lowStockCount}</strong></p>
                <p>Agotados: <strong>${metrics.inventory.outOfStockCount}</strong></p>
              </div>
              <div class="metric-card">
                <h4>💰 Ventas (30d)</h4>
                <p>Ingresos: <strong>S/. ${metrics.sales.totalRevenue.toFixed(2)}</strong></p>
                <p>Pedidos: <strong>${metrics.sales.totalOrders}</strong></p>
              </div>
              <div class="metric-card">
                <h4>📋 Procurement</h4>
                <p>POs borrador: <strong>${metrics.procurement.draftPOs}</strong></p>
                <p>POs urgentes: <strong>${metrics.procurement.urgentPOs}</strong></p>
              </div>
              <div class="metric-card">
                <h4>👥 Clientes</h4>
                <p>Total: <strong>${metrics.customers.totalCustomers}</strong></p>
                <p>Créditos: <strong>S/. ${metrics.customers.totalReferralCredits.toFixed(2)}</strong></p>
              </div>
            </div>

            <div class="ai-section">
              <h2>🤖 AI Business Coach - Análisis y Recomendaciones</h2>
              <div class="ai-recommendations">${aiRecommendations}</div>
            </div>

            <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
              <strong>💡 Acción Requerida:</strong> Revisa las recomendaciones del AI Coach y toma acción según la prioridad indicada.
            </p>
          </div>
          
          <div class="footer">
            <p>PlazaMedik - Sistema de Gestión Inteligente</p>
            <p style="font-size: 12px; color: #999;">
              Este es un mensaje automático del sistema.<br>
              No responder a este correo.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "PlazaMedik System <pedidos@plazamedik.net.pe>",
      to: ["plazamedik.net.pe@gmail.com"],
      subject: `${getUrgencyBadge(urgency)} - ${event_type.replace(/_/g, ' ')} - ${reason}`,
      html: emailHtml,
    });

    console.log("Business notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Business notification sent with AI recommendations",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-business-event function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

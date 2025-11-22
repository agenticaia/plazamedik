import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface NotificationRequest {
  po_id: string;
  order_number: string;
  product_name: string;
  product_code: string;
  quantity: number;
  priority: string;
  stock_actual: number;
  ai_reorder_point: number;
  supplier_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NotificationRequest = await req.json();

    console.log('📧 Enviando notificación de PO crítica:', payload);

    // Get admin users emails (you can customize this query)
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, profiles!inner(email)')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    const adminEmails = (adminUsers || [])
      .map((u: any) => u.profiles?.email)
      .filter(Boolean);

    if (adminEmails.length === 0) {
      console.warn('⚠️ No admin emails found. Using default email.');
      // Fallback email - replace with your actual admin email
      adminEmails.push('admin@plazamedik.com');
    }

    // Priority emoji and color
    const priorityEmoji = payload.priority === 'URGENT' ? '🔴' : payload.priority === 'HIGH' ? '🟠' : '🟢';
    const priorityText = payload.priority === 'URGENT' ? 'URGENTE' : payload.priority === 'HIGH' ? 'ALTA' : 'NORMAL';

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'PlazaMedik ERP <onboarding@resend.dev>', // Replace with your verified domain
      to: adminEmails,
      subject: `${priorityEmoji} PO Crítica Auto-Generada: ${payload.product_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .alert-box { background: ${payload.priority === 'URGENT' ? '#fee' : '#fff3cd'}; border-left: 4px solid ${payload.priority === 'URGENT' ? '#dc3545' : '#ffc107'}; padding: 15px; margin: 20px 0; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .info-item { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-label { font-size: 12px; color: #666; text-transform: uppercase; }
              .info-value { font-size: 18px; font-weight: bold; color: #333; margin-top: 5px; }
              .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🤖 Orden de Compra Auto-Generada</h1>
                <p>El sistema detectó stock crítico y creó automáticamente una PO</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  <h2>${priorityEmoji} Prioridad: ${priorityText}</h2>
                  <p><strong>Stock actual (${payload.stock_actual}) ha alcanzado el punto de reorden (${payload.ai_reorder_point})</strong></p>
                </div>

                <h3>📦 Detalles del Producto</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Producto</div>
                    <div class="info-value">${payload.product_name}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">SKU</div>
                    <div class="info-value">${payload.product_code}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Stock Actual</div>
                    <div class="info-value" style="color: #dc3545;">${payload.stock_actual} unidades</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Punto Reorden</div>
                    <div class="info-value">${payload.ai_reorder_point} unidades</div>
                  </div>
                </div>

                <h3>📋 Detalles de la Orden de Compra</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">N° Orden</div>
                    <div class="info-value">${payload.order_number}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Proveedor</div>
                    <div class="info-value">${payload.supplier_name}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Cantidad Sugerida</div>
                    <div class="info-value">${payload.quantity} unidades</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Estado</div>
                    <div class="info-value">BORRADOR</div>
                  </div>
                </div>

                <p style="margin-top: 20px;">
                  ⚡ <strong>Acción requerida:</strong> Revisa y envía esta orden al proveedor lo antes posible para evitar quiebres de stock.
                </p>

                <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}/admin/ordenes-compra" class="button">
                  Ver Orden de Compra →
                </a>
              </div>

              <div class="footer">
                <p>Este email fue generado automáticamente por PlazaMedik ERP</p>
                <p>Sistema de Inteligencia de Inventario - Trigger ROP</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ Email enviado exitosamente:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        email_id: emailResponse.data?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

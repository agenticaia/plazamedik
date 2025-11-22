import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyCustomerRequest {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    color?: string;
  }>;
  total: number;
  fulfillmentStatus: string;
  paymentStatus: string;
  trackingNumber?: string;
  courier?: string;
}

function createOrderNotificationEmail(data: NotifyCustomerRequest): string {
  const statusMessages = {
    UNFULFILLED: "En Preparación",
    PARTIAL: "Parcialmente Enviado",
    FULFILLED: "Completado",
    WAITING_STOCK: "Esperando Stock",
    CANCELLED: "Cancelado"
  };

  const paymentStatusMessages = {
    PAID: "Pagado",
    PENDING: "Pendiente",
    REFUNDED: "Reembolsado",
    CANCELLED: "Cancelado"
  };

  const fulfillmentStatusText = statusMessages[data.fulfillmentStatus as keyof typeof statusMessages] || data.fulfillmentStatus;
  const paymentStatusText = paymentStatusMessages[data.paymentStatus as keyof typeof paymentStatusMessages] || data.paymentStatus;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de tu Pedido</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">PlazaMedik</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Actualización de tu Pedido</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">
                Hola <strong>${data.customerName}</strong>,
              </p>
              
              <p style="font-size: 15px; color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
                Tu pedido <strong style="color: #667eea;">#${data.orderNumber}</strong> ha sido actualizado. Aquí están los detalles:
              </p>

              <!-- Order Status Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Estado de Envío:</span>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">
                            ${fulfillmentStatusText}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Estado de Pago:</span>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="background-color: ${data.paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7'}; color: ${data.paymentStatus === 'PAID' ? '#166534' : '#92400e'}; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;">
                            ${paymentStatusText}
                          </span>
                        </td>
                      </tr>
                      ${data.trackingNumber ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Número de Guía:</span>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${data.trackingNumber}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.courier ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Courier:</span>
                        </td>
                        <td align="right" style="padding: 8px 0;">
                          <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${data.courier}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <h3 style="font-size: 16px; color: #1f2937; margin: 0 0 15px 0; font-weight: 600;">Items del Pedido:</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${data.items.map((item, index) => `
                  <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                    <td style="padding: 15px; border-bottom: ${index < data.items.length - 1 ? '1px solid #e5e7eb' : 'none'};">
                      <div style="font-size: 14px; color: #1f2937; font-weight: 500; margin-bottom: 4px;">
                        ${item.productName}
                      </div>
                      <div style="font-size: 13px; color: #6b7280;">
                        ${item.color ? `Color: ${item.color} • ` : ''}Cantidad: ${item.quantity}
                      </div>
                    </td>
                    <td align="right" style="padding: 15px; border-bottom: ${index < data.items.length - 1 ? '1px solid #e5e7eb' : 'none'};">
                      <span style="font-size: 15px; color: #1f2937; font-weight: 600;">
                        S/ ${item.unitPrice.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                
                <!-- Total -->
                <tr style="background-color: #f3f4f6;">
                  <td style="padding: 20px; font-weight: 600; color: #1f2937; font-size: 16px;">
                    Total:
                  </td>
                  <td align="right" style="padding: 20px; font-weight: 700; color: #667eea; font-size: 18px;">
                    S/ ${data.total.toFixed(2)}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://plazamedik.net.pe/seguimiento" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Ver Estado de mi Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tracking Info -->
              <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0; line-height: 1.6; text-align: center;">
                Puedes dar seguimiento a tu pedido en cualquier momento visitando:<br>
                <a href="https://plazamedik.net.pe/seguimiento" style="color: #667eea; text-decoration: none; font-weight: 500;">
                  plazamedik.net.pe/seguimiento
                </a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">
                ¿Tienes preguntas? Contáctanos
              </p>
              <p style="font-size: 13px; color: #9ca3af; margin: 0;">
                © ${new Date().getFullYear()} PlazaMedik. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotifyCustomerRequest = await req.json();

    console.log("Sending order notification email to:", data.customerEmail);

    const emailResponse = await resend.emails.send({
      from: "PlazaMedik <onboarding@resend.dev>",
      to: [data.customerEmail],
      subject: `Actualización de tu Pedido #${data.orderNumber} - PlazaMedik`,
      html: createOrderNotificationEmail(data),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: emailResponse 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);

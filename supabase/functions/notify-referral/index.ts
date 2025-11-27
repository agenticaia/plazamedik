import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyReferralRequest {
  referrer_email?: string;
  referrer_name: string;
  referrer_phone: string;
  referred_name: string;
  referral_code: string;
  credit_amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      referrer_email,
      referrer_name,
      referrer_phone,
      referred_name,
      referral_code,
      credit_amount,
    }: NotifyReferralRequest = await req.json();

    console.log("Sending referral notification to:", referrer_email || referrer_phone);

    // Si no hay email, solo logueamos
    if (!referrer_email) {
      console.log(`Referral notification (SMS/WhatsApp): ${referrer_name} ganó S/. ${credit_amount}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notification logged (no email available)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
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
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .gift-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .amount {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              margin: 20px 0;
            }
            .details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="gift-icon">🎉</div>
            <h1>¡Felicitaciones ${referrer_name}!</h1>
            <p>Alguien usó tu código de referido</p>
          </div>
          
          <div class="content">
            <p>¡Tenemos excelentes noticias! <strong>${referred_name}</strong> acaba de realizar su primer pedido usando tu código de referido.</p>
            
            <div class="amount">
              + S/. ${credit_amount.toFixed(2)}
            </div>
            
            <div class="details">
              <h3 style="margin-top: 0;">Detalles del Referido</h3>
              <p><strong>Cliente referido:</strong> ${referred_name}</p>
              <p><strong>Tu código usado:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${referral_code}</code></p>
              <p><strong>Crédito ganado:</strong> S/. ${credit_amount.toFixed(2)}</p>
            </div>
            
            <p>Este crédito se ha agregado automáticamente a tu cuenta y puedes usarlo en tu próxima compra.</p>
            
            <h3>¿Sabías que puedes ganar más?</h3>
            <p>Cada vez que alguien use tu código de referido <strong>${referral_code}</strong>, tanto tú como tu amigo ganan S/. 15. ¡Comparte tu código y sigue ganando!</p>
            
            <div style="text-align: center;">
              <a href="https://plazamedik.net.pe/invite/${referral_code}" class="button">
                Compartir mi Código
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Gracias por ser parte de la familia PlazaMedik</p>
            <p style="font-size: 12px; color: #999;">
              PlazaMedik - Medias de Compresión de Calidad<br>
              Lima, Perú
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "PlazaMedik <pedidos@plazamedik.net.pe>",
      to: [referrer_email],
      subject: `🎉 ¡Ganaste S/. ${credit_amount}! Alguien usó tu código`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral notification sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-referral function:", error);
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

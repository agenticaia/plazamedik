import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML Email Template
const createResetPasswordEmail = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablece tu Contraseña - PlazaMedik</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.4;">
                🔐 Restablecimiento de Contraseña
              </h1>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 0 40px;">
              <p style="margin: 0 0 16px; color: #484848; font-size: 16px; line-height: 26px;">
                Hola,
              </p>
              <p style="margin: 0 0 16px; color: #484848; font-size: 16px; line-height: 26px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta de administrador en <strong>PlazaMedik</strong>.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 32px 40px;" align="center">
              <a href="${resetLink}" 
                 target="_blank" 
                 style="display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; line-height: 1.5;">
                Restablecer Contraseña
              </a>
            </td>
          </tr>
          
          <!-- Additional Info -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0 0 16px; color: #484848; font-size: 16px; line-height: 26px;">
                Este enlace expirará en <strong>24 horas</strong> por seguridad.
              </p>
            </td>
          </tr>
          
          <!-- Warning Box -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 16px; border-radius: 6px;">
                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 24px;">
                  ⚠️ Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; border-top: 1px solid #e6ebf1;">
              <p style="margin: 0; color: #8898aa; font-size: 12px; line-height: 20px; text-align: center;">
                © ${new Date().getFullYear()} PlazaMedik - Sistema de Gestión Administrativa
                <br>
                <a href="https://plazamedik.net.pe" 
                   target="_blank" 
                   style="color: #0ea5e9; text-decoration: underline;">
                  plazamedik.net.pe
                </a>
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 400, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log('📧 Processing password reset email request...');
    
    const { user, email_data } = payload;
    const { token_hash, redirect_to, email_action_type } = email_data;

    if (!user?.email) {
      throw new Error('User email is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured');
    }

    // Construct the reset link
    const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    console.log('📧 Sending password reset email to:', user.email);

    // Generate HTML email
    const htmlContent = createResetPasswordEmail(resetLink);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'PlazaMedik <onboarding@resend.dev>', // Change to your verified domain
      to: [user.email],
      subject: '🔐 Restablece tu Contraseña - PlazaMedik',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

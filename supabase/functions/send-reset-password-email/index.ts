import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import React from 'npm:react@18.3.1';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ResetPasswordEmail } from './_templates/reset-password.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 400, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);

    // Verify webhook signature if secret is configured
    let emailData;
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      const verified = wh.verify(payload, headers) as {
        user: { email: string };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
        };
      };
      emailData = verified;
    } else {
      // If no hook secret, parse directly (less secure but works for testing)
      emailData = JSON.parse(payload);
    }

    const { user, email_data } = emailData;
    const { token_hash, redirect_to, email_action_type } = email_data;

    console.log('📧 Sending password reset email to:', user.email);

    // Render React Email template
    const html = await renderAsync(
      React.createElement(ResetPasswordEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token_hash,
        redirect_to,
        email_action_type,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'PlazaMedik <onboarding@resend.dev>', // Change to your verified domain
      to: [user.email],
      subject: '🔐 Restablece tu Contraseña - PlazaMedik',
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('💥 Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

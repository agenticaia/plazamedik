import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customer_name,
      customer_lastname,
      customer_phone,
      customer_district,
      customer_address,
      customer_lat,
      customer_lng,
      product_code,
      product_name,
      product_color,
      product_price,
      quantity = 1,
      source = 'web',
      referral_code_used = null,
    } = await req.json();

    // Validar campos requeridos
    if (!customer_name || !customer_lastname || !customer_phone || !customer_district || !customer_address ||
        !product_code || !product_name || !product_color || product_price === undefined) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar precio
    const priceNum = Number(product_price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      return new Response(
        JSON.stringify({ error: 'Precio inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generar número de orden de venta
    const { data: orderNumber, error: orderNumberError } = await supabase
      .rpc('generate_sales_order_number');

    if (orderNumberError) throw orderNumberError;

    // Calcular total con descuento por referido si aplica
    const REFERRAL_DISCOUNT = 15;
    let discount = 0;
    let validReferralCode: string | null = null;
    let referrerData: { id: string; name: string; lastname: string | null; phone: string } | null = null;

    if (referral_code_used) {
      // Validar que el código de referido existe y obtener datos del referente
      const { data: referrer } = await supabase
        .from('customers')
        .select('id, name, lastname, phone, referral_code')
        .eq('referral_code', referral_code_used)
        .maybeSingle();

      if (referrer) {
        discount = REFERRAL_DISCOUNT;
        validReferralCode = referral_code_used;
        referrerData = referrer;
        console.log(`Aplicando descuento de S/.${REFERRAL_DISCOUNT} por código de referido: ${referral_code_used}`);
      }
    }

    const subtotal = priceNum * quantity;
    const total = Math.max(subtotal - discount, 0);

    // Crear orden de venta con código de referido si aplica
    const { data: salesOrder, error: salesOrderError } = await supabase
      .from('sales_orders')
      .insert({
        order_number: orderNumber,
        customer_name: String(customer_name).slice(0, 100),
        customer_lastname: String(customer_lastname).slice(0, 100),
        customer_phone: String(customer_phone).slice(0, 20),
        customer_district: String(customer_district).slice(0, 100),
        customer_address: customer_address ? String(customer_address).slice(0, 500) : null,
        customer_lat: customer_lat ? Number(customer_lat) : null,
        customer_lng: customer_lng ? Number(customer_lng) : null,
        total: total,
        fulfillment_status: 'UNFULFILLED',
        payment_status: 'PENDING',
        payment_method: 'CONTRA_ENTREGA',
        source: source,
        referral_code_used: validReferralCode,
        notes: validReferralCode ? `🎁 Descuento por referido: S/.${discount} (Código: ${validReferralCode})` : null,
      })
      .select()
      .single();

    if (salesOrderError) throw salesOrderError;

    // Crear item de orden
    const { error: itemError } = await supabase
      .from('sales_order_items')
      .insert({
        sales_order_id: salesOrder.id,
        product_code: String(product_code).slice(0, 20),
        product_name: String(product_name).slice(0, 200),
        product_color: String(product_color).slice(0, 50),
        quantity: quantity,
        unit_price: priceNum,
      });

    if (itemError) throw itemError;

    console.log('Pedido creado:', orderNumber, validReferralCode ? `con descuento de S/.${discount}` : '');

    // Notificar al referente por WhatsApp si usaron su código
    if (referrerData && validReferralCode) {
      try {
        await notifyReferrer(referrerData, customer_name, orderNumber, total);
        console.log('Notificación enviada al referente:', referrerData.phone);
      } catch (notifyError) {
        // No bloquear el pedido si falla la notificación
        console.error('Error al notificar referente (no bloqueante):', notifyError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_number: orderNumber,
        order_id: salesOrder.id,
        subtotal: subtotal,
        discount: discount,
        total: total,
        referral_code_applied: validReferralCode,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error al crear pedido:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Función para notificar al referente por WhatsApp
async function notifyReferrer(
  referrer: { id: string; name: string; lastname: string | null; phone: string },
  referredCustomerName: string,
  orderNumber: string,
  orderTotal: number
) {
  const phone = referrer.phone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('51') ? phone : `51${phone}`;
  
  const message = `🎉 ¡Hola ${referrer.name}!

Tu amigo/a ${referredCustomerName} acaba de hacer su primer pedido usando tu código de referido.

📦 Pedido: ${orderNumber}
💰 Total: S/. ${orderTotal.toFixed(2)}

Cuando se pague el pedido, recibirás S/. 15 de crédito en tu cuenta.

¡Gracias por recomendar PlazaMedik! 💚
Sigue compartiendo tu código y gana más créditos.

👉 Tu código: ${referrer.phone ? `https://plazamedik.net.pe/invite/` : ''}`;

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
  // Registrar la notificación en el log (para tracking)
  console.log(`WhatsApp notification URL generated for referrer ${formattedPhone}:`, whatsappUrl);
  
  // Intentar enviar vía Kapso si está configurado
  const kapsoApiKey = Deno.env.get('KAPSO_API_KEY');
  
  if (kapsoApiKey) {
    try {
      const response = await fetch('https://api.kapso.ai/v1/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kapsoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('WhatsApp enviado via Kapso:', result);
        return { success: true, via: 'kapso', messageId: result.messageId };
      } else {
        console.error('Error de Kapso:', await response.text());
      }
    } catch (kapsoError) {
      console.error('Error al enviar por Kapso:', kapsoError);
    }
  }
  
  // Si no hay Kapso, solo loggeamos (el mensaje se puede enviar manualmente)
  return { success: true, via: 'link', url: whatsappUrl };
}

// Servicio de integración con WhatsApp Business API
// Integrado con Kapso.ai para funcionalidades avanzadas

import { Pedido } from '@/types/pedidos';
import { kapsoService } from './kapsoService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Plantilla de mensaje para confirmación de pedido (Fallback)
 */
function generarMensajeConfirmacion(pedido: Pedido): string {
  const listaProductos = pedido.productos
    .map((p) => `• ${p.nombre} - S/ ${p.precio.toFixed(2)} x ${p.cantidad}`)
    .join('\n');

  const mensaje = `
¡Hola ${pedido.cliente_nombre}! 👋

Recibimos tu pedido: *${pedido.codigo}*

📦 *RESUMEN*
${listaProductos}

💰 *TOTAL: S/ ${pedido.precio_total.toFixed(2)}*

📍 *UBICACIÓN*
${pedido.direccion_completa}, ${pedido.distrito}

⏱️ *ENTREGA*
Mañana 9am-5pm en tu domicilio

💳 *PAGO*
${getPagoTexto(pedido.metodo_pago)}

👉 *CONFIRMA RECIBIENDO ESTE MENSAJE* para proceder con la entrega.

Si tienes dudas, escribe aquí.

¡Gracias por confiar en PlazaMedik! 🏥
  `.trim();

  return mensaje;
}

function getPagoTexto(metodo: string): string {
  const opciones: Record<string, string> = {
    cod: 'Contraentrega (efectivo o POS)',
    yape: 'Ya pagaste por Yape ✓',
    plin: 'Ya pagaste por Plin ✓',
    transferencia: 'Ya transferiste ✓',
    tarjeta: 'Ya pagaste con tarjeta ✓',
  };
  return opciones[metodo] || 'A definir';
}

/**
 * Enviar mensaje de confirmación de pedido
 * Usa Kapso.ai si está configurado, sino genera link de WhatsApp
 */
export async function enviarMensajeWhatsApp(
  pedido: Pedido,
  apiKey?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validar teléfono
    const telefonoFormato = pedido.cliente_telefono.replace(/\D/g, '');
    if (!telefonoFormato.startsWith('51')) {
      return {
        success: false,
        error: 'Teléfono debe ser de Perú (+51)',
      };
    }

    // Intentar enviar con Kapso.ai (template aprobado)
    const kapsoConfigured = import.meta.env.VITE_KAPSO_API_KEY;

    if (kapsoConfigured) {
      console.log('📱 Enviando confirmación con Kapso.ai...');
      const resultado = await kapsoService.enviarConfirmacionPedido(pedido);

      if (resultado.success) {
        // Registrar mensaje enviado
        await registrarMensajeEnviado({
          pedido_id: pedido.id,
          telefono: pedido.cliente_telefono,
          template: 'order_confirmation',
          message_id: resultado.messageId,
          estado: 'enviado',
        });

        return resultado;
      } else {
        console.warn('⚠️ Kapso falló, usando fallback:', resultado.error);
      }
    }

    // Fallback: Generar link de WhatsApp
    const mensaje = generarMensajeConfirmacion(pedido);
    console.log(`📱 Generando link de WhatsApp para +${telefonoFormato}:`);
    console.log(mensaje);

    return {
      success: true,
      messageId: `fallback_${Date.now()}`,
    };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Enviar recordatorio de pago
 */
export async function enviarRecordatorioPago(pedido: Pedido): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resultado = await kapsoService.enviarRecordatorioPago(pedido);

    if (resultado.success) {
      await registrarMensajeEnviado({
        pedido_id: pedido.id,
        telefono: pedido.cliente_telefono,
        template: 'payment_reminder',
        message_id: resultado.messageId,
        estado: 'enviado',
      });
    }

    return resultado;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Enviar notificación de envío en camino
 */
export async function enviarNotificacionEnvio(pedido: Pedido): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const trackingUrl = `https://plazamedik.com/seguimiento?codigo=${pedido.codigo}`;
    const resultado = await kapsoService.enviarNotificacionEnvio(pedido, trackingUrl);

    if (resultado.success) {
      await registrarMensajeEnviado({
        pedido_id: pedido.id,
        telefono: pedido.cliente_telefono,
        template: 'delivery_on_way',
        message_id: resultado.messageId,
        estado: 'enviado',
      });
    }

    return resultado;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Generar link de WhatsApp directo (para fallback o pruebas)
 */
export function generarLinkWhatsApp(pedido: Pedido): string {
  const telefono = pedido.cliente_telefono.replace(/\D/g, '');
  const mensaje = generarMensajeConfirmacion(pedido);
  const mensajeCodificado = encodeURIComponent(mensaje);

  return `https://wa.me/${telefono}?text=${mensajeCodificado}`;
}

/**
 * Registrar mensaje enviado en base de datos
 * TODO: Descomentar después de ejecutar migración 20241130_campanas_whatsapp.sql
 */
async function registrarMensajeEnviado(data: {
  pedido_id?: string;
  campana_id?: string;
  telefono: string;
  template: string;
  message_id?: string;
  estado: string;
}): Promise<void> {
  try {
    // Temporalmente deshabilitado hasta ejecutar migración
    console.log('📝 Mensaje registrado (pendiente migración):', data);

    // await supabase.from('mensajes_whatsapp').insert({
    //   ...data,
    //   enviado_at: new Date().toISOString(),
    // });
  } catch (error) {
    console.error('Error registrando mensaje:', error);
  }
}

/**
 * Extraer coordenadas de Google Maps URL
 */
export function extraerCoordenadaDeGoogleMaps(url: string): { lat: number; lng: number } | null {
  try {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[@?](\d+),(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2]),
        };
      }
    }
  } catch (error) {
    console.error('Error extrayendo coordenadas:', error);
  }

  return null;
}

// Exportar funciones adicionales de Kapso
export { kapsoService } from './kapsoService';

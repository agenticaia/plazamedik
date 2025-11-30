// Servicio de integración con WhatsApp Business API

import { Pedido } from '@/types/pedidos';

/**
 * Plantilla de mensaje para confirmación de pedido
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
 * Enviar mensaje por WhatsApp (usando API de Twilio o similar)
 * Esta función es un placeholder - necesita integración real
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

    const mensaje = generarMensajeConfirmacion(pedido);

    // TODO: Integrar con API real (Twilio, Meta, etc)
    console.log(`📱 Enviando WhatsApp a +${telefonoFormato}:`);
    console.log(mensaje);

    // Placeholder: Simular envío
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
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
 * Generar link de WhatsApp directo para pruebas
 */
export function generarLinkWhatsApp(pedido: Pedido): string {
  const telefono = pedido.cliente_telefono.replace(/\D/g, '');
  const mensaje = generarMensajeConfirmacion(pedido);
  const mensajeCodificado = encodeURIComponent(mensaje);

  return `https://wa.me/${telefono}?text=${mensajeCodificado}`;
}

/**
 * Extraer número de teléfono del link de Google Maps
 * Placeholder para función futura
 */
export function extraerCoordenadaDeGoogleMaps(url: string): { lat: number; lng: number } | null {
  try {
    // Pattern para URLs de Google Maps
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

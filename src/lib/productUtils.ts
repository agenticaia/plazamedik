// Utilidades para manejar productos y enlaces de WhatsApp

export function getWhatsAppLink(productName: string, message?: string): string {
  const phone = "51941941083";
  const text = message || `Hola, quiero información del producto: ${productName} - vengo de PlazaMedik.net.pe`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppLinkGeneric(message: string): string {
  const phone = "51941941083";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

import { MessageCircle } from "lucide-react";
import { getWhatsAppLink } from "@/lib/productUtils";

const WhatsAppFloat = () => {
  return (
    <a
      href={getWhatsAppLink("", "Hola, necesito asesoría sobre medias de compresión")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-health-green hover:bg-health-green/90 text-white p-5 rounded-full shadow-hover transition-all hover:scale-110 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-clinical-alert rounded-full animate-ping" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-clinical-alert rounded-full" />
    </a>
  );
};

export default WhatsAppFloat;

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle, Loader2 } from "lucide-react";
import { getWhatsAppLink } from "@/lib/productUtils";
import { motion } from "framer-motion";

interface WhatsAppTransitionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
}

const WhatsAppTransition = ({ open, onOpenChange, productName }: WhatsAppTransitionProps) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        const message = `¡Hola! 👋 Quiero continuar con mi compra.\nVengo desde la web y necesito ayuda para elegir talla y color.\n\nProducto: ${productName}`;
        const whatsappUrl = getWhatsAppLink(productName, message);
        window.open(whatsappUrl, "_blank");
        setIsRedirecting(false);
        onOpenChange(false);
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [open, productName, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6 py-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-20 h-20 bg-whatsapp-green/10 rounded-full flex items-center justify-center mx-auto"
          >
            <MessageCircle className="w-10 h-10 text-whatsapp-green" />
          </motion.div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-foreground">
              Estamos redirigiéndote a WhatsApp
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Un asesor te ayudará a elegir talla, color y nivel de compresión.
              <span className="block mt-2 font-medium text-foreground">
                Respuesta en menos de 2 minutos.
              </span>
            </p>
          </div>

          {isRedirecting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Abriendo WhatsApp...</span>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppTransition;

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, Package, Phone, CheckCircle2, ArrowRight, Gift, X, Coins } from "lucide-react";
import AddressSearch from "./AddressSearch";
import { cn } from "@/lib/utils";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  selectedColor?: string;
}

const WHATSAPP_NUMBER = "51941941083"; // Número correcto de WhatsApp
const REFERRAL_DISCOUNT = 15;

const OrderModal = ({ open, onOpenChange, product, selectedColor }: OrderModalProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const [availableCredits, setAvailableCredits] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    district: "",
    address: "",
    lat: null as number | null,
    lng: null as number | null,
    color: selectedColor || product.colors[0] || "Piel",
  });

  // Cargar código de referido desde localStorage y créditos del cliente
  useEffect(() => {
    if (open) {
      const savedCode = localStorage.getItem("referral_code");
      if (savedCode) {
        setReferralCode(savedCode);
      }
      
      // Cargar créditos del cliente si está logueado
      if (user?.email || user?.phone) {
        loadCustomerCredits();
      }
    }
  }, [open, user]);

  const loadCustomerCredits = async () => {
    try {
      let query = supabase
        .from("customers")
        .select("referral_credits, name, lastname, phone, district, address");
      
      if (user?.email) {
        query = query.eq("email", user.email);
      } else if (user?.phone) {
        query = query.eq("phone", user.phone);
      }
      
      const { data } = await query.maybeSingle();
      
      if (data) {
        setAvailableCredits(data.referral_credits || 0);
        // Pre-llenar datos del cliente si están vacíos
        if (!formData.name && data.name) {
          setFormData(prev => ({
            ...prev,
            name: data.name || "",
            lastname: data.lastname || "",
            phone: data.phone || "",
            district: data.district || "",
            address: data.address || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error loading customer credits:", error);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFormData({
      name: "",
      lastname: "",
      phone: "",
      district: "",
      address: "",
      lat: null,
      lng: null,
      color: selectedColor || product.colors[0] || "Piel",
    });
    setOrderCode("");
    setAppliedDiscount(0);
    setUseCredits(false);
  };

  const removeReferralCode = () => {
    localStorage.removeItem("referral_code");
    setReferralCode(null);
    toast({
      title: "Código removido",
      description: "El descuento ya no se aplicará",
    });
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.lastname || !formData.phone || !formData.district || !formData.address) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    // Las coordenadas ya tienen valores por defecto (fallback a Lima) 
    // si Google Maps no estuvo disponible, así que siempre tendrán valores
    if (!formData.lat || !formData.lng) {
      // Esto no debería ocurrir con la nueva lógica, pero lo dejamos como seguridad
      toast({
        title: "Error",
        description: "No se pudo procesar la dirección. Intenta de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
        // Calcular créditos a usar (máximo el precio del producto)
        const creditsToUse = useCredits ? Math.min(availableCredits, product.priceSale) : 0;
        
        const { data, error } = await supabase.functions.invoke("create-sales-order", {
          body: {
            customer_name: formData.name,
            customer_lastname: formData.lastname,
            customer_phone: formData.phone,
            customer_district: formData.district,
            customer_address: formData.address,
            customer_lat: formData.lat,
            customer_lng: formData.lng,
            product_code: product.code,
            product_name: product.name,
            product_color: formData.color,
            product_price: product.priceSale,
            quantity: 1,
            source: 'web',
            referral_code_used: referralCode,
            credits_to_use: creditsToUse,
          },
        });

      if (error) throw error;

      setOrderCode(data.order_number);
      setAppliedDiscount(data.discount || 0);
      
      // Limpiar código de referido después de usarlo
      if (data.referral_code_applied) {
        localStorage.removeItem("referral_code");
      }
      
      setStep(4);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      toast({
        title: "Error",
        description: "No pudimos procesar tu pedido. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendToWhatsApp = () => {
    const coordsText = formData.lat && formData.lng 
      ? `📍 Coordenadas: ${formData.lat.toFixed(6)}, ${formData.lng.toFixed(6)}\n🗺️ Ver mapa: https://www.google.com/maps?q=${formData.lat},${formData.lng}`
      : '';

    const discountText = appliedDiscount > 0 
      ? `🎁 *Descuento por referido:* -S/ ${appliedDiscount.toFixed(2)}\n` 
      : '';

    const finalTotal = product.priceSale - appliedDiscount;

    const message = `¡Hola! 👋

*Nuevo Pedido - ${orderCode}*

📦 *Producto:* ${product.name}
🎨 *Color:* ${formData.color}
💰 *Precio:* S/ ${product.priceSale.toFixed(2)}
${discountText}💵 *Total a pagar:* S/ ${finalTotal.toFixed(2)}

👤 *Cliente:*
Nombre: ${formData.name} ${formData.lastname}
📱 Teléfono: ${formData.phone}
📍 Distrito: ${formData.district}
🏠 Dirección: ${formData.address}
${coordsText}

🔍 *Código de Seguimiento:* ${orderCode}

¡Gracias por tu compra! Pronto nos pondremos en contacto contigo. 😊`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    handleClose();
  };

  // Calcular precio con descuentos
  const creditsDiscount = useCredits ? Math.min(availableCredits, product.priceSale) : 0;
  const referralDiscount = referralCode ? REFERRAL_DISCOUNT : 0;
  const totalDiscount = creditsDiscount + referralDiscount;
  const finalPrice = Math.max(product.priceSale - totalDiscount, 0);


  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">¡Excelente Elección! 🎉</h3>
              <p className="text-muted-foreground text-lg">
                Las medias <span className="font-semibold text-foreground">{product.name}</span> son perfectas para{" "}
                {product.idealFor.toLowerCase()}
              </p>

              <div className="bg-accent/20 border border-accent rounded-lg p-6 mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  "Uso estas medias diariamente y me han ayudado muchísimo con la circulación. ¡Son súper cómodas!"
                </p>
                <p className="text-xs font-semibold text-foreground">— María T., Cliente satisfecha</p>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full" size="lg">
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Pide Gratis, Paga en Casa 🏠</h3>
              <p className="text-muted-foreground text-lg">
                No pagas ahora. Solo cuando recibas tu pedido en tu domicilio.
              </p>

              <div className="bg-primary/10 border border-primary rounded-lg p-6 mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground text-left">
                    <strong>Contra entrega:</strong> Pagas cuando te entregamos el producto
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground text-left">
                    <strong>Sin riesgos:</strong> Puedes verificar el producto antes de pagar
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground text-left">
                    <strong>100% seguro:</strong> Garantía de satisfacción
                  </p>
                </div>
              </div>

              <div className="bg-accent/20 border border-accent rounded-lg p-4 mt-4">
                <Phone className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Te enviaremos un mensaje de confirmación por WhatsApp al número:
                  <span className="font-semibold text-foreground block mt-1">+{WHATSAPP_NUMBER}</span>
                </p>
              </div>
            </div>

            <Button onClick={() => setStep(3)} className="w-full" size="lg">
              Continuar con mi pedido
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Completa tus datos</h3>
              <p className="text-sm text-muted-foreground">Solo necesitamos algunos datos para procesar tu pedido</p>
            </div>

            <div className="space-y-4">
              {/* Mostrar créditos disponibles */}
              {availableCredits > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          Tienes S/ {availableCredits.toFixed(2)} en créditos
                        </p>
                        <p className="text-xs text-emerald-600">De tu programa de referidos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {useCredits && (
                        <span className="text-lg font-bold text-green-600">
                          -S/ {Math.min(availableCredits, product.priceSale).toFixed(2)}
                        </span>
                      )}
                      <Switch 
                        checked={useCredits}
                        onCheckedChange={setUseCredits}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mostrar cupón de descuento si hay código de referido */}
              {referralCode && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          ¡Descuento de referido aplicado!
                        </p>
                        <p className="text-xs text-amber-600">Código: {referralCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">-S/ {REFERRAL_DISCOUNT}</span>
                      <button 
                        onClick={removeReferralCode}
                        className="p-1 hover:bg-amber-200/50 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-amber-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-foreground mb-2">Producto seleccionado:</p>
                <p className="text-sm text-muted-foreground">{product.name}</p>
                
                {totalDiscount > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        S/ {product.priceSale.toFixed(2)}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        S/ {finalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {useCredits && creditsDiscount > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                          Créditos: -S/ {creditsDiscount.toFixed(2)}
                        </Badge>
                      )}
                      {referralCode && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          Referido: -S/ {REFERRAL_DISCOUNT}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-primary mt-1">S/ {product.priceSale.toFixed(2)}</p>
                )}
                
                {product.colors && product.colors.length > 1 && (
                  <div className="pt-2 border-t">
                    <Label className="text-sm font-semibold text-foreground">Color seleccionado:</Label>
                    <div className="flex gap-2 mt-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all",
                            formData.color === color 
                              ? "border-primary scale-110 shadow-lg" 
                              : "border-border hover:border-primary/50",
                            color.toLowerCase() === "piel" && "bg-[#f5d7c4]",
                            color.toLowerCase() === "negro" && "bg-[#1a1a1a]",
                            color.toLowerCase() === "blanco" && "bg-white",
                            color.toLowerCase() === "beige" && "bg-[#f5f5dc]"
                          )}
                          title={color}
                        >
                          <span className="sr-only">{color}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Seleccionado: <span className="font-semibold text-foreground">{formData.color}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <Label htmlFor="lastname">Apellido *</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    placeholder="Tu apellido"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono / WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 987654321"
                  />
                </div>

                <div>
                  <Label htmlFor="district">Distrito (Lima) *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Ej: Miraflores, San Isidro..."
                  />
                </div>

                <AddressSearch
                  value={formData.address}
                  onChange={(address, lat, lng) => 
                    setFormData({ ...formData, address, lat, lng })
                  }
                  placeholder="Busca tu dirección exacta..."
                />

                <div>
                  <Label htmlFor="color">Color *</Label>
                  <div className="flex gap-2 mt-2">
                    {product.colors.map((color) => (
                      <Badge
                        key={color}
                        variant={formData.color === color ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFormData({ ...formData, color })}
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg" 
              disabled={isLoading || !formData.lat || !formData.lng}
            >
              {isLoading ? "Procesando..." : "Confirmar Pedido"}
            </Button>
            {!formData.lat || !formData.lng ? (
              <p className="text-xs text-destructive text-center">
                ⚠️ Debes seleccionar tu dirección del menú desplegable para continuar
              </p>
            ) : null}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">¡Pedido Confirmado! 🎉</h3>

              <div className="bg-primary/10 border border-primary rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Tu código de seguimiento es:</p>
                <p className="text-3xl font-bold text-primary">{orderCode}</p>
              </div>

              <div className="space-y-3 text-left bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>¿Cómo hacer seguimiento?</strong>
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Ve a la sección de "Seguimiento" en nuestra web</li>
                  <li>
                    Ingresa tu código: <span className="font-semibold text-foreground">{orderCode}</span>
                  </li>
                  <li>Verás el estado actual de tu pedido</li>
                </ol>
              </div>

              <div className="bg-accent/20 border border-accent rounded-lg p-4">
                <Phone className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Te enviaremos la confirmación por WhatsApp</p>
                <p className="text-sm font-semibold text-foreground mt-1">+{WHATSAPP_NUMBER}</p>
              </div>
            </div>

            <Button onClick={sendToWhatsApp} className="w-full" size="lg">
              Enviar a WhatsApp
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">{renderStep()}</DialogContent>
    </Dialog>
  );
};

export default OrderModal;

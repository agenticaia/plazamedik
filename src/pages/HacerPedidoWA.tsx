import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Package, Phone, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import AddressSearch from "@/components/AddressSearch";

const HacerPedidoWA = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  // Extraer parámetros de URL
  const [formData, setFormData] = useState({
    name: searchParams.get('nombre') || "",
    lastname: searchParams.get('apellido') || "",
    phone: searchParams.get('telefono') || "",
    district: searchParams.get('distrito') || "",
    address: searchParams.get('direccion') || "",
    lat: null as number | null,
    lng: null as number | null,
    productCode: searchParams.get('producto') || "",
    productName: searchParams.get('nombre_producto') || "",
    productPrice: parseFloat(searchParams.get('precio') || '0'),
    color: searchParams.get('color') || "Piel",
  });

  useEffect(() => {
    // Si no hay producto, redirigir al catálogo
    if (!formData.productCode || !formData.productName) {
      toast({
        title: "Error",
        description: "No se encontró información del producto",
        variant: "destructive",
      });
      navigate('/catalogo');
    }
  }, [formData.productCode, formData.productName, navigate, toast]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.lastname || !formData.phone || !formData.district || !formData.address) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-sales-order", {
        body: {
          customer_name: formData.name,
          customer_lastname: formData.lastname,
          customer_phone: formData.phone,
          customer_district: formData.district,
          customer_address: formData.address,
          customer_lat: formData.lat,
          customer_lng: formData.lng,
          product_code: formData.productCode,
          product_name: formData.productName,
          product_color: formData.color,
          product_price: formData.productPrice,
          quantity: 1,
          source: 'whatsapp',
        },
      });

      if (error) throw error;

      setOrderCode(data.order_number);
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

    const message = `¡Hola! 👋

*Nuevo Pedido - ${orderCode}*

📦 *Producto:* ${formData.productName}
🎨 *Color:* ${formData.color}
💰 *Precio:* S/ ${formData.productPrice.toFixed(2)}

👤 *Cliente:*
Nombre: ${formData.name} ${formData.lastname}
📱 Teléfono: ${formData.phone}
📍 Distrito: ${formData.district}
🏠 Dirección: ${formData.address}
${coordsText}

🔍 *Código de Seguimiento:* ${orderCode}

¡Gracias por tu compra! Pronto nos pondremos en contacto contigo. 😊`;

    const whatsappUrl = `https://wa.me/51941941083?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    navigate('/');
  };

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
                Has seleccionado: <span className="font-semibold text-foreground">{formData.productName}</span>
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-lg font-bold text-primary">S/ {formData.productPrice.toFixed(2)}</p>
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
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-2">Producto seleccionado:</p>
                <p className="text-sm text-muted-foreground">{formData.productName}</p>
                <p className="text-lg font-bold text-primary mt-1">S/ {formData.productPrice.toFixed(2)}</p>
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
                    <Badge
                      variant={formData.color === "Piel" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, color: "Piel" })}
                    >
                      Piel
                    </Badge>
                    <Badge
                      variant={formData.color === "Negro" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, color: "Negro" })}
                    >
                      Negro
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Pedido"
              )}
            </Button>
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
                <p className="text-2xl font-bold text-primary break-all">{orderCode}</p>
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
                <p className="text-sm font-semibold text-foreground mt-1">+51941941083</p>
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
    <>
      <Navigation />
      <main className="min-h-screen bg-background pt-24 pb-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Hacer Pedido desde WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStep()}
            </CardContent>
          </Card>

          {/* Instrucciones para WhatsApp */}
          <Card className="mt-8 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">📱 Cómo usar esta función desde WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Para hacer un pedido directamente desde WhatsApp, envía un enlace con el siguiente formato:
              </p>
              <div className="bg-background p-4 rounded-lg font-mono text-xs overflow-x-auto">
                {`https://tudominio.com/hacer-pedido-wa?producto=750&nombre_producto=Media%20Compresiva&precio=200&nombre=Juan&apellido=Perez&telefono=987654321&distrito=Miraflores&color=Piel`}
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Parámetros requeridos:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>producto:</strong> Código del producto</li>
                  <li><strong>nombre_producto:</strong> Nombre del producto</li>
                  <li><strong>precio:</strong> Precio del producto</li>
                  <li><strong>nombre:</strong> Nombre del cliente (opcional, se puede llenar después)</li>
                  <li><strong>apellido:</strong> Apellido del cliente (opcional)</li>
                  <li><strong>telefono:</strong> Teléfono del cliente (opcional)</li>
                  <li><strong>distrito:</strong> Distrito de entrega (opcional)</li>
                  <li><strong>direccion:</strong> Dirección del cliente (opcional)</li>
                  <li><strong>color:</strong> Color del producto (opcional, por defecto: Piel)</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                Los parámetros opcionales pueden omitirse y el cliente los llenará en el formulario.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HacerPedidoWA;

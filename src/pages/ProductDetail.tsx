import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import RecommendationPanel from "@/components/RecommendationPanel";
import WhatsAppTransition from "@/components/WhatsAppTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codigo = searchParams.get("codigo");
  const [whatsappTransitionOpen, setWhatsappTransitionOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");

  const { product, loading, error } = useProduct(codigo);

  // Set initial selected color when product loads
  useEffect(() => {
    if (product && !selectedColor) {
      const initialColor = product.colors?.[0] || "Piel";
      setSelectedColor(initialColor);
    }
  }, [product, selectedColor]);

  // Incrementar vistas del producto
  useEffect(() => {
    if (product && codigo) {
      supabase.rpc('increment_product_views', { p_product_code: codigo });
    }
  }, [product, codigo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Cargando producto...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Producto no encontrado</h1>
          <Button onClick={() => navigate("/catalogo")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al catálogo
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <WhatsAppFloat />
      <WhatsAppTransition 
        open={whatsappTransitionOpen}
        onOpenChange={setWhatsappTransitionOpen}
        productName={product.name}
      />

      {/* Breadcrumb */}
      <section className="bg-muted border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/catalogo")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al catálogo
          </Button>
        </div>
      </section>

      {/* Product Detail */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Image */}
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/product-750-1.jpg";
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <Badge className="mb-2">{product.compression}</Badge>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {product.name}
                  </h1>
                  <p className="text-lg text-primary font-medium">{product.subtitle}</p>
                </div>

                {/* Price */}
                <div className="space-y-3 border-y border-border py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-primary">
                      S/ {product.priceSale.toFixed(2)}
                    </span>
                    <span className="text-xl text-muted-foreground line-through">
                      S/ {product.priceOriginal.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(((product.priceOriginal - product.priceSale) / product.priceOriginal) * 100)}% OFF
                    </Badge>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5">
                    <p className="text-sm font-semibold text-primary flex items-center gap-2">
                      <span className="text-lg">🚚</span>
                      Envío en 24h a Lima • 48h a todo Perú
                    </p>
                  </div>
                </div>

                {/* Sizes & Colors */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Tallas disponibles:</p>
                    <p className="text-xs text-muted-foreground mb-2">Te ayudamos a elegir la correcta por WhatsApp</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <Badge key={size} variant="outline">{size}</Badge>
                      ))}
                    </div>
                  </div>
                  {product.colors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Colores disponibles:</p>
                      <div className="flex gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all",
                              selectedColor === color 
                                ? "border-primary scale-110 shadow-lg" 
                                : "border-border hover:border-primary/50",
                              color.toLowerCase() === "piel" && "bg-[#f5d7c4]",
                              color.toLowerCase() === "negro" && "bg-[#1a1a1a]"
                            )}
                            title={color}
                          >
                            <span className="sr-only">{color}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Color seleccionado: <span className="font-semibold text-foreground">{selectedColor}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setWhatsappTransitionOpen(true)}
                    size="lg"
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Pedir por WhatsApp
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    ✓ Respuesta en menos de 2 minutos • ✓ Te ayudamos a elegir talla y color
                  </p>
                </div>

                {/* Ideal For */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-semibold text-primary">Ideal para:</span>{" "}
                    <span className="text-primary/80">{product.idealFor}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits & Specs */}
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {/* Benefits */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Beneficios</h2>
                <div className="space-y-3">
                  {product.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specs */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Especificaciones</h2>
                <div className="space-y-3">
                  {product.specs.map((spec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div className="lg:sticky lg:top-24 self-start">
            <RecommendationPanel currentProductCode={product.code} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetail;

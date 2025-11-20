import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import RecommendationModal from "@/components/RecommendationModal";
import OrderModal from "@/components/OrderModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import { products } from "@/data/products";

const ProductDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codigo = searchParams.get("codigo");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);

  const product = products.find((p) => p.code === codigo);

  if (!product) {
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
      <OrderModal 
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        product={product}
      />
      <RecommendationModal
        open={recommendationsOpen}
        onOpenChange={setRecommendationsOpen}
        currentProductCode={product.code}
        currentProductName={product.name}
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
                <div className="flex items-baseline gap-3 border-y border-border py-4">
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

                {/* Sizes & Colors */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Tallas disponibles:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <Badge key={size} variant="outline">{size}</Badge>
                      ))}
                    </div>
                  </div>
                  {product.colors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Colores disponibles:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <Badge key={color} variant="outline">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => setOrderModalOpen(true)}
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Pedir por WhatsApp
                </Button>

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
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
                Te puede interesar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Descubre productos similares recomendados por IA basados en las preferencias de otros clientes
              </p>
              <Button 
                onClick={() => setRecommendationsOpen(true)}
                className="w-full"
                variant="default"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ver Recomendaciones
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetail;

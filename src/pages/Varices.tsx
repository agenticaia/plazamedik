import { useState } from "react";
import Navigation from "@/components/Navigation";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { TestDialog } from "@/components/TestDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ClipboardCheck, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";

const Varices = () => {
  const [testOpen, setTestOpen] = useState(false);
  const { products, loading } = useProducts();
  
  const varicesProducts = products.filter(p => 
    p.category.includes("varices") && p.stock > 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <WhatsAppFloat />
      <TestDialog open={testOpen} onOpenChange={setTestOpen} />

      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Medias para Várices
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Compresión médica 20-30 mmHg que alivia el dolor, reduce la hinchazón y mejora la apariencia de las várices
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => setTestOpen(true)} className="bg-health-green hover:bg-health-green/90 text-white transition-all hover:scale-105">
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Hacer Test Gratis
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 transition-all">
                <a href="/catalogo">Ver catálogo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Explicación */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              ¿Cómo ayudan las medias de compresión con las várices?
            </h2>
            <p className="text-muted-foreground mb-6">
              Las medias de compresión graduada ejercen presión controlada sobre tus piernas, siendo más fuerte en el tobillo y disminuyendo gradualmente hacia arriba. Esta presión:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Mejora la circulación</h3>
                      <p className="text-sm text-muted-foreground">Ayuda a que la sangre fluya hacia arriba, evitando que se acumule en las venas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Reduce la hinchazón</h3>
                      <p className="text-sm text-muted-foreground">Disminuye la retención de líquidos y el edema al final del día</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Alivia el dolor</h3>
                      <p className="text-sm text-muted-foreground">La sensación de pesadez y dolor disminuye significativamente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Previene complicaciones</h3>
                      <p className="text-sm text-muted-foreground">Evita que las várices empeoren y reduce el riesgo de úlceras</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">
              ¿Por qué compresión 20-30 mmHg?
            </h3>
            <p className="text-sm text-muted-foreground">
              Esta es la compresión Clase II, recomendada médicamente para várices moderadas a severas. Es lo suficientemente fuerte para ser efectiva, pero cómoda para uso diario. No necesitas receta médica, pero es el mismo nivel que prescriben los doctores.
            </p>
          </div>
        </div>
      </section>

      {/* Subcategorías */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Encuentra tu solución perfecta
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-border hover:shadow-card transition-shadow">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary">XL+</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Tallas Grandes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Medias específicamente diseñadas para tallas XL, 2XL y 3XL. Cómodas, efectivas y que no aprietan donde no deben.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-card transition-shadow">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">👗</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Discretas y Elegantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Se ven como medias normales. Nadie notará que son terapéuticas. Perfectas para usar con vestidos o faldas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-card transition-shadow">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🤰</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Para el Embarazo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Las pantys completas son ideales durante y después del embarazo. Previenen várices y alivian la hinchazón.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Productos */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
          Medias recomendadas para várices
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando productos...</span>
          </div>
        ) : varicesProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {varicesProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay productos disponibles en esta categoría</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Varices;

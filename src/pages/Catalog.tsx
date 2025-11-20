import { useState } from "react";
import Navigation from "@/components/Navigation";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { TestDialog } from "@/components/TestDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Check, Filter, ClipboardCheck, MessageCircle, X } from "lucide-react";
import RecommendationPanel from "@/components/RecommendationPanel";
import { products, getWhatsAppLink, Product } from "@/data/products";

const Catalog = () => {
  const [testOpen, setTestOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "all" || product.category.includes(selectedCategory);
    const typeMatch = selectedType === "all" || product.type === selectedType;
    return categoryMatch && typeMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <WhatsAppFloat />
      <TestDialog open={testOpen} onOpenChange={setTestOpen} />
      
      {/* Panel lateral de recomendaciones */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] p-0">
          {selectedProduct && (
            <div className="h-full flex flex-col">
              {/* Detalle del producto seleccionado */}
              <div className="border-b border-border p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-32 h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-xl text-foreground mb-1">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-sm text-primary font-medium mb-2">{selectedProduct.subtitle}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">S/ {selectedProduct.priceSale.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground line-through">S/ {selectedProduct.priceOriginal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedProduct.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Ideal para:</span> {selectedProduct.idealFor}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedProduct.type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedProduct.compression}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Tallas {selectedProduct.sizes[0]}-{selectedProduct.sizes[selectedProduct.sizes.length - 1]}
                  </Badge>
                  {selectedProduct.colors.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {selectedProduct.colors.join(", ")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Panel de recomendaciones */}
              <div className="flex-1 overflow-hidden p-6">
                <RecommendationPanel currentProductCode={selectedProduct.code} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Catálogo de Medias de Compresión
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Encuentra la media perfecta para tus necesidades. Todas con compresión médica 20-30 mmHg
            </p>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-accent/10 border-y border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">¿No sabes qué modelo elegir?</span> Haz el test o escríbenos
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setTestOpen(true)}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Hacer Test
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={getWhatsAppLink("", "Hola, necesito ayuda")} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Filtrar por:</h2>
        </div>

        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Problema:</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("all")}
              >
                Todos
              </Badge>
              <Badge
                variant={selectedCategory === "varices" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("varices")}
              >
                Várices
              </Badge>
              <Badge
                variant={selectedCategory === "trabajo-pie" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("trabajo-pie")}
              >
                Trabajo de pie
              </Badge>
              <Badge
                variant={selectedCategory === "piel-sensible" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory("piel-sensible")}
              >
                Piel sensible
              </Badge>
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tipo:</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedType === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedType("all")}
              >
                Todos
              </Badge>
              <Badge
                variant={selectedType === "rodilla" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedType("rodilla")}
              >
                Hasta rodilla
              </Badge>
              <Badge
                variant={selectedType === "muslo" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedType("muslo")}
              >
                Hasta muslo
              </Badge>
              <Badge
                variant={selectedType === "panty" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedType("panty")}
              >
                Panty completo
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onSelect={setSelectedProduct}
                isSelected={selectedProduct?.id === product.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No se encontraron productos con estos filtros
            </p>
            <Button onClick={() => { setSelectedCategory("all"); setSelectedType("all"); }}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Catalog;

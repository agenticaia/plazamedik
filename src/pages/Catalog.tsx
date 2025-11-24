import { useState } from "react";
import Navigation from "@/components/Navigation";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { TestDialog } from "@/components/TestDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWhatsAppLink } from "@/lib/productUtils";
import { useProducts } from "@/hooks/useProducts";
import { Filter, ClipboardCheck, MessageCircle, Loader2 } from "lucide-react";

const Catalog = () => {
  const [testOpen, setTestOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  
  // Use grouped products in catalog to avoid duplicates
  const { products, loading, error } = useProducts(false, true);

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "all" || product.category.includes(selectedCategory);
    const zoneMatch = selectedZone === "all" || (product as any).zona_pierna === selectedZone;
    return categoryMatch && zoneMatch;
  });

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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" onClick={() => setTestOpen(true)} className="bg-health-green hover:bg-health-green/90 text-white transition-all">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Hacer Test
              </Button>
              <Button asChild size="sm" className="bg-whatsapp-green hover:bg-whatsapp-green/90 text-white transition-all">
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

          {/* Zone Filter */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Zona de la pierna:</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedZone === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("all")}
              >
                Todas
              </Badge>
              <Badge
                variant={selectedZone === "pies" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("pies")}
              >
                Pies
              </Badge>
              <Badge
                variant={selectedZone === "pantorrilla" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("pantorrilla")}
              >
                Pantorrilla
              </Badge>
              <Badge
                variant={selectedZone === "pierna_media" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("pierna_media")}
              >
                Pierna media
              </Badge>
              <Badge
                variant={selectedZone === "rodilla" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("rodilla")}
              >
                Rodilla
              </Badge>
              <Badge
                variant={selectedZone === "muslo" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("muslo")}
              >
                Muslo
              </Badge>
              <Badge
                variant={selectedZone === "panty" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedZone("panty")}
              >
                Pierna completa / Panty
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando productos...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Error al cargar productos: {error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showTreatmentButton />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No se encontraron productos con estos filtros
                </p>
                <Button onClick={() => { setSelectedCategory("all"); setSelectedZone("all"); }}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Catalog;

import { useNavigate } from 'react-router-dom';
import { useHomeRecommendations } from '@/hooks/useHomeRecommendations';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecommendationsCarousel() {
  const { recommendations, loading } = useHomeRecommendations(8);
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Recomendado para ti
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Recomendado para ti
            </h2>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">
            Basado en tu historial de navegación
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {recommendations.map((product) => (
              <CarouselItem key={product.product_code} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                  onClick={() => navigate(`/catalogo?codigo=${product.product_code}`)}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.imagen_url || '/images/product-750-1.jpg'}
                      alt={product.nombre_producto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/images/product-750-1.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {Math.round(product.similarity_score * 100)}% Match
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-2 min-h-[2.5rem]">
                      {product.nombre_producto}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.categoria}</p>
                    <p className="text-primary font-bold text-lg">
                      S/ {product.precio.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
            Recomendaciones actualizadas por IA en tiempo real
          </p>
        </div>
      </div>
    </section>
  );
}

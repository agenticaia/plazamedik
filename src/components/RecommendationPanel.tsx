import React from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecommendationPanelProps {
  currentProductCode: string;
}

export default function RecommendationPanel({ currentProductCode }: RecommendationPanelProps) {
  const { recommendations, loading, error, trackRecommendationClick } = useRecommendations(currentProductCode);
  const navigate = useNavigate();

  const handleRecommendationClick = async (productCode: string) => {
    await trackRecommendationClick(productCode);
    navigate(`/catalogo?codigo=${productCode}`);
  };

  if (error) {
    return null;
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No hay recomendaciones disponibles</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.product_code}
              className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-card"
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={rec.imagen_url || '/placeholder.svg'}
                  alt={rec.nombre_producto}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center font-medium">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {Math.round(rec.similarity_score * 100)}% Compatible
                  </span>
                </div>

                {/* Title & Category */}
                <div>
                  <h4 className="font-semibold text-base text-foreground mb-1 line-clamp-2">
                    {rec.nombre_producto}
                  </h4>
                  <p className="text-xs text-muted-foreground">{rec.categoria}</p>
                </div>

                {/* Price */}
                <p className="text-primary font-bold text-2xl">
                  S/ {rec.precio.toFixed(2)}
                </p>

                {/* Button */}
                <Button
                  onClick={() => handleRecommendationClick(rec.product_code)}
                  className="w-full"
                  variant="default"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Badge */}
      {!loading && recommendations.length > 0 && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs">
          <p className="font-semibold text-primary mb-1 flex items-center">
            <Sparkles className="w-4 h-4 mr-1" />
            Recomendado por IA
          </p>
          <p className="text-primary/80">
            Basado en preferencias de clientes similares y tu historial de navegación
          </p>
        </div>
      )}
    </div>
  );
}

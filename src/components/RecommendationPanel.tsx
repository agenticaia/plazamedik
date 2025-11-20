import React from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Stethoscope, Sparkles } from 'lucide-react';
import TreatmentRecommendationCard from '@/components/TreatmentRecommendationCard';

const WHATSAPP_NUMBER = '51978978706';

interface RecommendationPanelProps {
  currentProductCode: string;
}

export default function RecommendationPanel({ currentProductCode }: RecommendationPanelProps) {
  const { recommendations, loading, error, trackRecommendationClick } = useRecommendations(currentProductCode);

  const handleWhatsAppClick = async (productCode: string, productName: string, price: number) => {
    await trackRecommendationClick(productCode);
    
    const message = `Hola! Me interesa este producto de mi tratamiento recomendado:\n\n📦 *${productName}*\n💰 Precio: S/ ${price.toFixed(2)}\n🆔 Código: ${productCode}\n\n¿Está disponible?`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (error) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header con diseño de receta médica */}
      <div className="border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Tu Tratamiento</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Prescripción personalizada basada en tu necesidad
        </p>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No hay productos disponibles para tu tratamiento en este momento
            </p>
          </div>
        ) : (
          <>
            {recommendations.map((rec) => (
              <TreatmentRecommendationCard
                key={rec.product_code}
                product_code={rec.product_code}
                nombre_producto={rec.nombre_producto}
                precio={rec.precio}
                imagen_url={rec.imagen_url}
                similarity_score={rec.similarity_score}
                categoria={rec.categoria}
                onWhatsAppClick={handleWhatsAppClick}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer con info de IA */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="font-semibold text-primary text-xs mb-1 flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Prescripción Inteligente
          </p>
          <p className="text-primary/80 text-xs">
            Análisis basado en IA y preferencias de clientes con necesidades similares
          </p>
        </div>
      </div>
    </div>
  );
}

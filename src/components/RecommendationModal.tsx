import { useState } from 'react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Shield, 
  Award, 
  Clock,
  Users,
  MessageCircle,
  ChevronRight,
  Package,
  Ruler,
  Droplets
} from 'lucide-react';
import { getWhatsAppLink } from '@/data/products';

interface RecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProductCode: string;
  currentProductName: string;
}

export default function RecommendationModal({ 
  open, 
  onOpenChange, 
  currentProductCode,
  currentProductName 
}: RecommendationModalProps) {
  const { recommendations, loading, trackRecommendationClick } = useRecommendations(currentProductCode, 1);
  const navigate = useNavigate();
  const [showTechSpecs, setShowTechSpecs] = useState(false);

  const topRecommendation = recommendations[0];

  const handleWhatsAppClick = async () => {
    if (topRecommendation) {
      await trackRecommendationClick(topRecommendation.product_code);
      const message = `Hola, me interesa el tratamiento recomendado: ${topRecommendation.nombre_producto}`;
      window.open(getWhatsAppLink('', message), '_blank');
    }
  };

  const handleViewDetails = async () => {
    if (topRecommendation) {
      await trackRecommendationClick(topRecommendation.product_code);
      onOpenChange(false);
      navigate(`/producto?codigo=${topRecommendation.product_code}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header con Trust Bar */}
        <div className="bg-primary text-primary-foreground p-8 text-center">
          <DialogHeader>
            <h2 className="text-3xl font-bold mb-2">Tu receta para el alivio</h2>
            <p className="text-primary-foreground/90 mb-6">Recomendación personalizada basada en IA</p>
          </DialogHeader>
          
          {/* Trust Bar */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-5 h-5" />
              <span className="text-xs">Importador directo</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="w-5 h-5" />
              <span className="text-xs">Calidad certificada</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users className="w-5 h-5" />
              <span className="text-xs">Expertos humanos</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-5 h-5" />
              <span className="text-xs">24/7</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </div>
        ) : topRecommendation ? (
          <div className="p-8 relative">
            {/* Hero Card - Tratamiento Recomendado */}
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              {/* Imagen del producto */}
              <div className="relative">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                  <img
                    src={topRecommendation.imagen_url || '/placeholder.svg'}
                    alt={topRecommendation.nombre_producto}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                  TRATAMIENTO RECOMENDADO
                </Badge>
              </div>

              {/* Info del producto */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {topRecommendation.nombre_producto}
                  </h3>
                  <p className="text-muted-foreground">
                    {topRecommendation.categoria}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {Math.round(topRecommendation.similarity_score * 100)}% compatible con tu búsqueda
                    </span>
                  </div>
                </div>

                {/* Precio */}
                <div className="border-t border-b border-border py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">
                      S/ {topRecommendation.precio.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Doble Vía de Acción */}
                <div className="space-y-3">
                  {/* Botón WhatsApp - Primario */}
                  <Button
                    onClick={handleWhatsAppClick}
                    size="lg"
                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-lg py-6"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contactar por WhatsApp
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    ¿Dudas de talla o necesitas asesoría? Conecta con un experto humano
                  </p>

                  {/* Botón Secundario */}
                  <Button
                    onClick={handleViewDetails}
                    variant="outline"
                    size="lg"
                    className="w-full py-6"
                  >
                    Ver Detalles Completos
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Info de por qué se recomienda */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-semibold text-primary">💡 Por qué lo recomendamos:</span>{" "}
                    <span className="text-primary/80">
                      Basado en las preferencias de clientes que vieron "{currentProductName}" 
                      y tu historial de navegación
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Panel Lateral - Tech Specs */}
            <button
              onClick={() => setShowTechSpecs(!showTechSpecs)}
              className="absolute top-0 right-0 bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-l-lg shadow-lg transition-all"
            >
              <span className="text-xs font-medium">
                {showTechSpecs ? '← Ocultar' : 'Detalles Técnicos →'}
              </span>
            </button>

            {showTechSpecs && (
              <div className="mt-6 bg-muted/50 border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Especificaciones Técnicas
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Material</p>
                      <p className="text-muted-foreground">Poliamida y Elastano</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Droplets className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Cuidados</p>
                      <p className="text-muted-foreground">Lavado a mano</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Importación</p>
                      <p className="text-muted-foreground">Directa de fábrica</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Garantía</p>
                      <p className="text-muted-foreground">Calidad certificada</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No hay recomendaciones disponibles en este momento
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

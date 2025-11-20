import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, ShoppingCart, TrendingUp } from 'lucide-react';
import OrderModal from '@/components/OrderModal';

interface TreatmentRecommendationCardProps {
  product_code: string;
  nombre_producto: string;
  precio: number;
  imagen_url: string;
  similarity_score: number;
  categoria: string;
  onWhatsAppClick: (productCode: string, productName: string, price: number) => void;
}

export default function TreatmentRecommendationCard({
  product_code,
  nombre_producto,
  precio,
  imagen_url,
  similarity_score,
  categoria,
  onWhatsAppClick,
}: TreatmentRecommendationCardProps) {
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Convertir a formato Product para OrderModal
  const productForModal = {
    id: product_code,
    code: product_code,
    name: nombre_producto,
    subtitle: categoria,
    priceOriginal: precio,
    priceSale: precio,
    image: imagen_url || '/placeholder.svg',
    category: [categoria],
    type: 'Media de compresión',
    compression: '20-30 mmHg',
    benefits: ['Compresión médica graduada', 'Material hipoalergénico'],
    specs: ['Compresión médica graduada', 'Material hipoalergénico'],
    idealFor: categoria,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro', 'Beige'],
    brand: 'PlazaMedik',
    model: nombre_producto,
    description: nombre_producto,
  };

  return (
    <>
      <OrderModal 
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        product={productForModal}
      />
      
      <Card className="overflow-hidden border-border hover:border-primary/50 transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex gap-4 mb-3">
            <div className="w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
              <img
                src={imagen_url || '/placeholder.svg'}
                alt={nombre_producto}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-2 text-foreground mb-1">
                {nombre_producto}
              </p>
              <p className="text-xs text-muted-foreground mb-2">{categoria}</p>
              <p className="text-primary font-bold text-xl">
                S/ {precio.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Badge de compatibilidad */}
          <div className="mb-3">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full inline-flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.round(similarity_score * 100)}% Compatible con tu necesidad
            </span>
          </div>

          {/* Doble CTA */}
          <div className="space-y-2">
            <Button
              onClick={() => onWhatsAppClick(product_code, nombre_producto, precio)}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Pedir por WhatsApp
            </Button>
            
            <Button
              onClick={() => setOrderModalOpen(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Comprar Directo
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

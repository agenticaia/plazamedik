import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageCircle, Sparkles } from "lucide-react";
import { Product } from "@/data/products";
import OrderModal from "@/components/OrderModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecommendationPanel from "@/components/RecommendationPanel";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

const ProductCard = ({ product, featured = false }: ProductCardProps) => {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/producto?codigo=${product.code}`);
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderModalOpen(true);
  };

  const handleRecommendationsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecommendationsOpen(true);
  };

  return (
    <>
      <OrderModal 
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        product={product}
      />
    <Card 
      onClick={handleCardClick}
      className="group overflow-hidden bg-gradient-card border-border hover:shadow-hover transition-all duration-300 hover:scale-[1.02] cursor-pointer"
    >
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          {featured && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
              Destacado
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-primary font-medium">{product.subtitle}</p>
        </div>

        {/* Precio con descuento */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">S/ {product.priceSale.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground line-through">S/ {product.priceOriginal.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          {product.benefits.slice(0, 3).map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Ideal para:</span> {product.idealFor}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {product.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {product.compression}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Tallas {product.sizes[0]}-{product.sizes[product.sizes.length - 1]}
          </Badge>
          {product.colors.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {product.colors.join(", ")}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-2">
        <Button
          onClick={handleOrderClick}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground group-hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Pedir por WhatsApp
        </Button>
        <Button
          onClick={handleRecommendationsClick}
          variant="outline"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Te puede interesar
        </Button>
      </CardFooter>
    </Card>

    <Dialog open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Recomendaciones para ti
          </DialogTitle>
        </DialogHeader>
        <RecommendationPanel currentProductCode={product.code} />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ProductCard;

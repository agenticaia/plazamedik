import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Heart, Eye } from "lucide-react";
import type { GroupedProduct } from "@/hooks/useProducts";
import OrderModal from "@/components/OrderModal";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getProductUrl } from "@/lib/slugUtils";

interface ProductCardProps {
  product: GroupedProduct;
  featured?: boolean;
  showTreatmentButton?: boolean;
}

const ProductCard = ({ product, featured = false, showTreatmentButton = false }: ProductCardProps) => {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.variants?.[0]?.color || product.colors[0] || "Piel");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Get current variant based on selected color
  const currentVariant = product.variants?.find(v => v.color === selectedColor) || product.variants?.[0];
  const currentImage = currentVariant?.image || product.image;

  const handleCardClick = () => {
    // Usar nueva URL con slugs amigables para SEO
    const url = getProductUrl(product.name, product.category[0], product.code);
    navigate(url);
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOrderModalOpen(true);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleFavorite(product.code);
  };

  return (
    <>
      <OrderModal 
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        product={product}
        selectedColor={selectedColor}
      />
    <Card
      onClick={handleCardClick}
      className="group overflow-hidden bg-gradient-card border-border hover:shadow-hover transition-all duration-300 hover:scale-[1.02] cursor-pointer"
    >
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={currentImage}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "/images/product-750-1.jpg";
            }}
          />
          {featured && (
            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
              Destacado
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 left-3 bg-background/80 hover:bg-background",
              isFavorite(product.code) && "text-red-500"
            )}
            onClick={handleFavoriteClick}
          >
            <Heart 
              className={cn(
                "w-5 h-5",
                isFavorite(product.code) && "fill-current"
              )} 
            />
          </Button>
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
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">S/ {product.priceSale.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground line-through">S/ {product.priceOriginal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-2 py-0.5">
              🚚 24h Lima • 48h Perú
            </Badge>
          </div>
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
        </div>

        {/* Color Selector */}
        {product.allColors && product.allColors.length > 1 && (
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Color:</p>
            <div className="flex gap-2">
              {product.allColors.map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(color);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    selectedColor === color 
                      ? "border-primary scale-110" 
                      : "border-border hover:border-primary/50",
                    color.toLowerCase() === "piel" && "bg-[#f5d7c4]",
                    color.toLowerCase() === "negro" && "bg-[#1a1a1a]"
                  )}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-2">
        <Button
          onClick={handleCardClick}
          variant="outline"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Producto
        </Button>
        <Button
          onClick={handleOrderClick}
          className="w-full bg-primary hover:bg-primary/90"
        >
          Lo quiero
        </Button>
      </CardFooter>
    </Card>
    </>
  );
};

export default ProductCard;

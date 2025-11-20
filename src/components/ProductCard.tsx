import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/data/products";
import OrderModal from "@/components/OrderModal";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  onSelect?: (product: Product) => void;
  isSelected?: boolean;
}

const ProductCard = ({ product, featured = false, onSelect, isSelected = false }: ProductCardProps) => {
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    }
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
      className={`group overflow-hidden bg-gradient-card border-border hover:shadow-hover transition-all duration-300 hover:scale-[1.02] ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
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
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) {
              onSelect(product);
            } else {
              setOrderModalOpen(true);
            }
          }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:scale-105 transition-transform"
        >
          {onSelect ? 'Ver tratamiento' : 'Comprar'}
        </Button>
      </CardFooter>
    </Card>
    </>
  );
};

export default ProductCard;

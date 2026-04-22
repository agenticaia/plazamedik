import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateProductSlug } from "@/lib/slugUtils";

interface FavoriteProduct {
  product_code: string;
  nombre_producto: string;
  precio: number;
  imagen_url: string | null;
  categoria: string;
}

export default function FavoritesSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleFavorite } = useFavorites();

  const { data: favoriteProducts = [], isLoading } = useQuery({
    queryKey: ["favorites-with-products", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: favs, error: favError } = await supabase
        .from("user_favorites")
        .select("product_code")
        .eq("user_id", user.id);

      if (favError) throw favError;
      if (!favs || favs.length === 0) return [];

      const codes = favs.map((f) => f.product_code);
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("product_code, nombre_producto, precio, imagen_url, categoria")
        .in("product_code", codes);

      if (prodError) throw prodError;
      return (products || []) as FavoriteProduct[];
    },
    enabled: !!user,
  });

  const handleViewProduct = (product: FavoriteProduct) => {
    const slug = generateProductSlug(product.nombre_producto, product.product_code);
    navigate(`/producto/${slug}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-destructive" fill="currentColor" />
          Mis Favoritos ({favoriteProducts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Aún no tienes productos favoritos
            </p>
            <Button onClick={() => navigate("/catalogo")} variant="outline">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Explorar catálogo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favoriteProducts.map((product) => (
              <div
                key={product.product_code}
                className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-card"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.product_code);
                  }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                  aria-label="Quitar de favoritos"
                >
                  <Heart className="w-4 h-4 text-destructive" fill="currentColor" />
                </button>

                <div
                  className="aspect-square bg-muted cursor-pointer overflow-hidden"
                  onClick={() => handleViewProduct(product)}
                >
                  {product.imagen_url ? (
                    <img
                      src={product.imagen_url}
                      alt={product.nombre_producto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {product.categoria}
                  </p>
                  <p className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.nombre_producto}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-primary">
                      S/. {product.precio.toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewProduct(product)}
                      className="h-7 text-xs"
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { QuickPurchaseOrderDialog } from './QuickPurchaseOrderDialog';
import type { ProductWithMetrics } from '@/hooks/useProductWithMetrics';
import { cn } from '@/lib/utils';

interface CriticalProduct {
  id: string;
  product_code: string;
  nombre_producto: string;
  cantidad_stock: number;
  ai_reorder_point: number;
  vendor_id: string | null;
  vendor_name: string | null;
  cost: number | null;
  precio: number;
  total_vendido: number;
  categoria: string;
}

export const SmartReplenishmentWidget = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMetrics | null>(null);
  const [suggestedQty, setSuggestedQty] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: criticalProducts, isLoading } = useQuery({
    queryKey: ['critical-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          product_code,
          nombre_producto,
          cantidad_stock,
          ai_reorder_point,
          vendor_id,
          cost,
          precio,
          total_vendido,
          categoria,
          vendors (
            name
          )
        `)
        .not('ai_reorder_point', 'is', null)
        .or('is_discontinued.is.null,is_discontinued.eq.false')
        .order('cantidad_stock', { ascending: true });

      if (error) throw error;

      // Filter and transform
      const critical = data
        ?.filter((p) => (p.cantidad_stock || 0) <= (p.ai_reorder_point || 0))
        .map((p) => ({
          id: p.id,
          product_code: p.product_code,
          nombre_producto: p.nombre_producto,
          cantidad_stock: p.cantidad_stock || 0,
          ai_reorder_point: p.ai_reorder_point || 0,
          vendor_id: p.vendor_id,
          vendor_name: (p.vendors as any)?.name || 'Sin proveedor',
          cost: p.cost,
          precio: p.precio,
          total_vendido: p.total_vendido || 0,
          categoria: p.categoria || 'General',
        }));

      return critical || [];
    },
  });

  const calculateSuggestedQty = (product: CriticalProduct) => {
    const targetStock = product.ai_reorder_point * 2;
    const currentStock = product.cantidad_stock;
    return Math.max(0, targetStock - currentStock);
  };

  const getStockHealthPercentage = (product: CriticalProduct) => {
    if (product.ai_reorder_point === 0) return 100;
    return Math.min(100, (product.cantidad_stock / product.ai_reorder_point) * 100);
  };

  const getStockHealthColor = (percentage: number) => {
    if (percentage === 0) return 'bg-destructive';
    if (percentage < 50) return 'bg-orange-500';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const getVelocity = (product: CriticalProduct) => {
    // Assuming total_vendido is for last 90 days
    return (product.total_vendido / 90).toFixed(1);
  };

  const handleRestock = (product: CriticalProduct) => {
    // Convert CriticalProduct to ProductWithMetrics format
    const productWithMetrics: ProductWithMetrics = {
      id: product.id,
      code: product.product_code,
      name: product.nombre_producto,
      category: [product.categoria], // category is string[] in BaseProduct
      cantidad_stock: product.cantidad_stock,
      priceSale: product.precio,
      total_views: 0,
      total_vendido: product.total_vendido,
      conversion_rate: 0,
      // Required fields from BaseProduct
      subtitle: '',
      image: '',
      benefits: [],
      specs: [],
      idealFor: '',
      type: 'rodilla',
      sizes: [],
      colors: [],
      priceOriginal: product.precio * 1.25,
      compression: '20-30 mmHg',
      brand: 'RelaxSan',
      model: 'Básico',
      // Required fields from ProductWithMetrics
      stock_status: product.cantidad_stock === 0 ? 'agotado' : product.cantidad_stock <= 10 ? 'bajo' : 'disponible',
      ingresos_generados: 0,
      total_recommendations: 0,
      demanda_diaria: product.total_vendido / 90,
      dias_restantes_stock: 0,
      fecha_proximo_pedido: null,
      badges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setSelectedProduct(productWithMetrics);
    setSuggestedQty(calculateSuggestedQty(product));
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            AI Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!criticalProducts || criticalProducts.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            AI Stock Alerts
            <Badge variant="outline" className="ml-auto">
              0 Items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ✅ Todos los productos tienen stock saludable
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-destructive/50 shadow-lg">
        <CardHeader className="bg-destructive/5">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            AI Stock Alerts
            <Badge variant="destructive" className="ml-auto">
              {criticalProducts.length} Items Critical
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {criticalProducts.map((product) => {
              const suggestedQty = calculateSuggestedQty(product);
              const healthPercentage = getStockHealthPercentage(product);
              const velocity = getVelocity(product);

              return (
                <Card key={product.id} className="border-l-4 border-l-destructive">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: Product Info */}
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{product.nombre_producto}</h4>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>SKU: {product.product_code}</span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {product.vendor_name}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Stock Health */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Stock Health</span>
                          <span className="font-medium">
                            {product.cantidad_stock} / {product.ai_reorder_point}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              getStockHealthColor(healthPercentage)
                            )}
                            style={{ width: `${healthPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{velocity} units/day</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  Velocidad de ventas: {velocity} unidades/día
                                  <br />
                                  Basado en últimos 90 días
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {healthPercentage === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              OUT OF STOCK
                            </Badge>
                          )}
                          {healthPercentage > 0 && healthPercentage < 100 && (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                              BELOW ROP
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Right: Action */}
                      <div className="flex items-center justify-end">
                        <Button
                          onClick={() => handleRestock(product)}
                          className="w-full md:w-auto"
                          variant={healthPercentage === 0 ? 'destructive' : 'default'}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Restock (+{suggestedQty})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <QuickPurchaseOrderDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={selectedProduct}
          suggestedQuantity={suggestedQty}
          onSuccess={() => {
            setIsDialogOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
};

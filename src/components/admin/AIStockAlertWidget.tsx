import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Package, ShoppingCart, TrendingUp, Flame } from "lucide-react";
import { QuickPurchaseOrderDialog } from "./QuickPurchaseOrderDialog";

interface CriticalProduct {
  product_code: string;
  nombre_producto: string;
  cantidad_stock: number;
  ai_reorder_point: number;
  sales_velocity_7d: number;
  vendor_id: string;
  vendor_name?: string;
  cost: number;
  lead_time_days: number;
}

export const AIStockAlertWidget = () => {
  const [selectedProduct, setSelectedProduct] = useState<CriticalProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [suggestedQty, setSuggestedQty] = useState(0);

  const { data: criticalProducts = [], isLoading } = useQuery({
    queryKey: ["critical-stock-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          product_code,
          nombre_producto,
          cantidad_stock,
          ai_reorder_point,
          sales_velocity_7d,
          vendor_id,
          cost,
          vendors (
            name,
            lead_time_days
          )
        `)
        .not("ai_reorder_point", "is", null)
        .order("cantidad_stock", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Filter products where cantidad_stock < ai_reorder_point
      const filtered = (data || []).filter((p: any) => 
        (p.cantidad_stock || 0) < (p.ai_reorder_point || 0)
      ).slice(0, 10);

      return filtered.map((p: any) => ({
        product_code: p.product_code,
        nombre_producto: p.nombre_producto,
        cantidad_stock: p.cantidad_stock || 0,
        ai_reorder_point: p.ai_reorder_point || 0,
        sales_velocity_7d: p.sales_velocity_7d || 0,
        vendor_id: p.vendor_id,
        vendor_name: p.vendors?.name || "Sin proveedor",
        cost: p.cost || 0,
        lead_time_days: p.vendors?.lead_time_days || 7,
      }));
    },
    refetchInterval: 30000,
  });

  const calculateSuggestedQty = (currentStock: number, rop: number) => {
    return Math.max(0, (rop * 2) - currentStock);
  };

  const getStockHealthPercentage = (currentStock: number, rop: number) => {
    if (rop === 0) return 100;
    return Math.min(100, (currentStock / rop) * 100);
  };

  const getDaysRemaining = (currentStock: number, velocity: number) => {
    if (velocity === 0) return 999;
    return Math.floor(currentStock / velocity);
  };

  const handleRestock = (product: CriticalProduct) => {
    const qty = calculateSuggestedQty(product.cantidad_stock, product.ai_reorder_point);
    setSuggestedQty(qty);
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Alertas de Reabastecimiento (IA)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-foreground">Alertas de Reabastecimiento (IA)</CardTitle>
            {criticalProducts.length > 0 && (
              <Badge variant="destructive" className="bg-red-600">
                {criticalProducts.length} Críticos
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Acción inmediata requerida para evitar rotura de stock.
          </p>
        </CardHeader>
        <CardContent>
          {criticalProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay productos en estado crítico</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {criticalProducts.map((product) => {
                const healthPercentage = getStockHealthPercentage(
                  product.cantidad_stock,
                  product.ai_reorder_point
                );
                const daysRemaining = getDaysRemaining(
                  product.cantidad_stock,
                  product.sales_velocity_7d
                );
                const suggestedQty = calculateSuggestedQty(
                  product.cantidad_stock,
                  product.ai_reorder_point
                );

                return (
                  <div key={product.product_code} className="py-4 flex items-center gap-4">
                    {/* Left Section: Product Identity */}
                    <div className="flex items-start gap-3 flex-grow min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {product.nombre_producto}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          SKU: {product.product_code} | Prov: {product.vendor_name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600">
                            Velocidad de venta alta
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Stock Health Bar */}
                    <div className="w-48 flex-shrink-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-muted-foreground">
                          Actual: <span className="font-bold text-foreground">{product.cantidad_stock}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ROP: {product.ai_reorder_point}
                        </span>
                      </div>
                      <Progress
                        value={healthPercentage}
                        className={`h-2 ${
                          product.cantidad_stock === 0
                            ? "[&>div]:bg-red-600"
                            : "[&>div]:bg-amber-500"
                        }`}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Cobertura est: {daysRemaining === 999 ? "∞" : `${daysRemaining}`} días
                      </p>
                    </div>

                    {/* Right Section: Immediate Action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleRestock(product)}
                        className={
                          product.cantidad_stock === 0
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                        }
                        size="sm"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        Pedir +{suggestedQty} uds
                      </Button>
                      <Button variant="ghost" size="sm" className="px-2">
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProduct && (
        <QuickPurchaseOrderDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={{
            product_code: selectedProduct.product_code,
            nombre_producto: selectedProduct.nombre_producto,
            cantidad_stock: selectedProduct.cantidad_stock,
            vendor_id: selectedProduct.vendor_id,
          } as any}
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

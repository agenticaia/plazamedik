import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface KPIBannerProps {
  metrics?: {
    total_productos: number;
    total_stock: number;
    total_vendido: number;
    total_ingresos: number;
    total_views: number;
    productos_bajo_stock: number;
    productos_agotados: number;
    conversion_rate_promedio: number;
  };
  inventoryValue: number;
  isLoading: boolean;
}

export const KPIBanner = ({ metrics, inventoryValue, isLoading }: KPIBannerProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Inventory Value */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            Valor Total de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            S/ {inventoryValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.total_stock.toLocaleString()} unidades disponibles
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Stock Health Monitor */}
      <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4 text-destructive" />
            Monitor de Salud de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="destructive" className="text-lg font-bold px-3 py-1">
              {metrics.productos_agotados}
            </Badge>
            <span className="text-sm text-muted-foreground">Agotados</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 text-sm font-semibold">
              {metrics.productos_bajo_stock}
            </Badge>
            <span className="text-xs text-muted-foreground">Stock Crítico Bajo</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Sales Efficiency */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
            Eficiencia de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-500">
            {metrics.conversion_rate_promedio.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tasa de Conversión Promedio
          </p>
          <p className="text-sm font-semibold mt-2 text-foreground">
            S/ {metrics.total_ingresos.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Ventas Históricas Totales</p>
        </CardContent>
      </Card>

      {/* Card 4: Catalog Scope */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            Alcance del Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
            {metrics.total_productos}
          </div>
          <p className="text-xs text-muted-foreground mt-1">SKUs Activos</p>
          <p className="text-sm font-semibold mt-2 text-foreground">
            {metrics.total_views.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Vistas Totales del Catálogo</p>
        </CardContent>
      </Card>
    </div>
  );
};

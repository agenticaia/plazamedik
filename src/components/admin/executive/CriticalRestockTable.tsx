import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LowStockProduct {
  product_code: string;
  nombre_producto: string;
  cantidad_stock: number;
  total_vendido: number;
  demanda_diaria: number;
  dias_restantes: number;
}

interface CriticalRestockTableProps {
  products?: LowStockProduct[];
  isLoading: boolean;
}

export const CriticalRestockTable = ({ products, isLoading }: CriticalRestockTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Recomendaciones Críticas de Reabastecimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-600" />
            Recomendaciones Críticas de Reabastecimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">✅ Todos los productos tienen stock suficiente</p>
            <p className="text-sm text-muted-foreground mt-2">No se requieren acciones inmediatas de reabastecimiento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">SIN STOCK</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="destructive" className="bg-red-600/90">CRÍTICO</Badge>;
    } else if (stock <= 10) {
      return <Badge className="bg-amber-600 text-white hover:bg-amber-700">BAJO</Badge>;
    } else {
      return <Badge variant="secondary">{stock}</Badge>;
    }
  };

  const getDaysRemainingBadge = (days: number) => {
    if (days <= 3) {
      return <Badge variant="destructive">{days}d</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-amber-600 text-white hover:bg-amber-700">{days}d</Badge>;
    } else {
      return <Badge variant="outline">{days}d</Badge>;
    }
  };

  const handleCreatePO = (productCode: string) => {
    navigate(`/admin/purchase-orders?product=${productCode}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Recomendaciones Críticas de Reabastecimiento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Acción inmediata requerida para {products.length} producto{products.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Producto</TableHead>
                <TableHead className="text-center">Stock Actual</TableHead>
                <TableHead className="text-center">Velocidad de Ventas</TableHead>
                <TableHead className="text-center">Cobertura Estimada</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.product_code}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.nombre_producto}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {product.product_code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(product.cantidad_stock)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-semibold">{product.demanda_diaria.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">unidades/día</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getDaysRemainingBadge(product.dias_restantes)}
                      <div className="text-xs text-muted-foreground">Días restantes</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleCreatePO(product.product_code)}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Crear OC
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

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
            Critical Restock Recommendations
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
            Critical Restock Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">✅ All products are well-stocked</p>
            <p className="text-sm text-muted-foreground mt-2">No immediate restock actions required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">OUT OF STOCK</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="destructive" className="bg-red-600/90">CRITICAL</Badge>;
    } else if (stock <= 10) {
      return <Badge className="bg-amber-600 text-white hover:bg-amber-700">LOW</Badge>;
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
          Critical Restock Recommendations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Immediate action required for {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-center">Current Stock</TableHead>
                <TableHead className="text-center">Sales Velocity</TableHead>
                <TableHead className="text-center">Estimated Coverage</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                    <div className="text-xs text-muted-foreground">units/day</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getDaysRemainingBadge(product.dias_restantes)}
                      <div className="text-xs text-muted-foreground">Days left</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleCreatePO(product.product_code)}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Create PO
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

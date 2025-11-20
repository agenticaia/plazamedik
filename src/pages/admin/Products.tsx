import { useState } from 'react';
import { useProductWithMetrics } from '@/hooks/useProductWithMetrics';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, TrendingUp, Package, DollarSign } from 'lucide-react';

export default function Products() {
  const { products, loading, refresh, getTotalMetrics } = useProductWithMetrics();
  const [searchTerm, setSearchTerm] = useState('');

  const metrics = getTotalMetrics();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Productos</h1>
            <p className="text-muted-foreground">Vista completa de inventario y ventas</p>
          </div>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Métricas generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <p className="text-2xl font-bold mt-2">{metrics.total_productos}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Total</p>
                  <p className="text-2xl font-bold mt-2">{metrics.total_stock}</p>
                  <p className="text-xs text-muted-foreground mt-1">unidades</p>
                </div>
                <div className="p-3 rounded-full bg-green-50 text-green-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendidos Total</p>
                  <p className="text-2xl font-bold mt-2">{metrics.total_vendido}</p>
                  <p className="text-xs text-muted-foreground mt-1">unidades</p>
                </div>
                <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Total</p>
                  <p className="text-2xl font-bold mt-2">S/ {metrics.total_ingresos?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-3 rounded-full bg-amber-50 text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de productos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Catálogo de Productos</CardTitle>
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Código</th>
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-center py-3 px-4">Stock</th>
                    <th className="text-center py-3 px-4">Vendidos</th>
                    <th className="text-right py-3 px-4">Precio</th>
                    <th className="text-right py-3 px-4">Ingresos</th>
                    <th className="text-center py-3 px-4">Conversión</th>
                    <th className="text-left py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.code} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{product.code}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.compression}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StockBadge stock={product.cantidad_stock} />
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {product.total_vendido}
                        </td>
                        <td className="py-3 px-4 text-right">
                          S/ {product.priceSale.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          S/ {product.ingresos_generados.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ConversionBadge rate={product.conversion_rate} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.badges.slice(0, 2).map((badge, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Componentes auxiliares
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Agotado</Badge>;
  }
  if (stock <= 10) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
        {stock}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      {stock}
    </Badge>
  );
}

function ConversionBadge({ rate }: { rate: number }) {
  const percentage = rate.toFixed(1);
  
  if (rate >= 5) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        {percentage}%
      </Badge>
    );
  }
  if (rate >= 2) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        {percentage}%
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
      {percentage}%
    </Badge>
  );
}

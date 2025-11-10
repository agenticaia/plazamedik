// Archivo: src/pages/admin/InventoryIA.tsx
// Componente del Dashboard de Predicción de Inventario con IA

import { useInventoryPrediction, useProductWithMetrics } from '@/hooks/useProductWithMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export default function InventoryIA() {
  const { 
    products, 
    loading, 
    getTopSellers,
    getLowStock,
    getOutOfStock,
    getTotalMetrics,
    refresh 
  } = useProductWithMetrics({ autoRefresh: true, refreshInterval: 60000 });

  const { predictions } = useInventoryPrediction();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const metrics = getTotalMetrics();
  const topSellers = getTopSellers(5);
  const lowStock = getLowStock(10);
  const outOfStock = getOutOfStock();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Predicción de Inventario</h1>
          <p className="text-gray-600">Pronóstico basado en IA para los próximos 7-30 días</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Productos"
          value={metrics.total_productos}
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Stock Total"
          value={metrics.total_stock}
          subtitle="unidades"
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Stock Bajo"
          value={metrics.productos_bajo_stock}
          subtitle="productos"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
        />
        <MetricCard
          title="Agotados"
          value={metrics.productos_agotados}
          subtitle="productos"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Alertas de Stock */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outOfStock.length > 0 && (
              <div className="p-3 bg-red-100 rounded-lg">
                <p className="font-semibold text-red-800">
                  🚨 {outOfStock.length} productos agotados
                </p>
                <p className="text-sm text-red-700">
                  {outOfStock.map(p => p.name).join(', ')}
                </p>
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="p-3 bg-yellow-100 rounded-lg">
                <p className="font-semibold text-yellow-800">
                  ⚠️ {lowStock.length} productos con stock bajo
                </p>
                <p className="text-sm text-yellow-700">
                  {lowStock.map(p => `${p.name} (${p.cantidad_stock} unidades)`).join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabla de Predicciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Predicción de Inventario (próximos 7-30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">PRODUCTO</th>
                  <th className="text-center p-3 font-semibold">STOCK ACTUAL</th>
                  <th className="text-center p-3 font-semibold">DEMANDA 7D</th>
                  <th className="text-center p-3 font-semibold">DÍAS RESTANTES</th>
                  <th className="text-center p-3 font-semibold">CONFIANZA</th>
                  <th className="text-center p-3 font-semibold">ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {predictions
                  .sort((a, b) => a.dias_restantes - b.dias_restantes)
                  .slice(0, 15)
                  .map((pred) => (
                    <tr key={pred.product_code} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{pred.nombre_producto}</p>
                          <p className="text-sm text-gray-500">{pred.product_code}</p>
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <StockBadge stock={pred.stock_actual} />
                      </td>
                      <td className="text-center p-3 font-semibold">
                        {pred.demanda_7d}
                      </td>
                      <td className="text-center p-3">
                        <DaysRemainingBadge days={pred.dias_restantes} />
                      </td>
                      <td className="text-center p-3">
                        <ConfidenceBadge confidence={pred.confianza} />
                      </td>
                      <td className="text-center p-3">
                        <ActionBadge action={pred.accion} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Sellers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 Top 5 Productos Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSellers.map((product, index) => (
              <div key={product.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <div className="flex gap-2 mt-1">
                      {product.badges.map(badge => (
                        <Badge key={badge} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {product.total_vendido}
                  </p>
                  <p className="text-sm text-gray-600">
                    S/ {product.ingresos_generados.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.cantidad_stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// COMPONENTES DE UTILIDAD
// ============================================

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}: { 
  title: string; 
  value: number; 
  subtitle?: string; 
  icon: React.ReactNode; 
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Agotado</Badge>;
  }
  if (stock <= 10) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
      {stock} unidades
    </Badge>;
  }
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
    {stock} unidades
  </Badge>;
}

function DaysRemainingBadge({ days }: { days: number }) {
  if (days <= 7) {
    return <Badge variant="destructive">{days} días</Badge>;
  }
  if (days <= 14) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
      {days} días
    </Badge>;
  }
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
    {days} días
  </Badge>;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  
  if (confidence >= 0.85) {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      {percentage}%
    </Badge>;
  }
  if (confidence >= 0.70) {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
      {percentage}%
    </Badge>;
  }
  return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
    {percentage}%
  </Badge>;
}

function ActionBadge({ action }: { action: string }) {
  if (action.includes('urgente')) {
    return <Badge variant="destructive" className="whitespace-nowrap">{action}</Badge>;
  }
  if (action.includes('ahora')) {
    return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 whitespace-nowrap">
      {action}
    </Badge>;
  }
  if (action.includes('Planificar')) {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 whitespace-nowrap">
      {action}
    </Badge>;
  }
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 whitespace-nowrap">
    {action}
  </Badge>;
}
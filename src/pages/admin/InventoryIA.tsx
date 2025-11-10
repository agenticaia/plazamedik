// ============================================
// ARCHIVO: src/pages/admin/InventoryIA.tsx
// Página standalone de Inventario IA (fuera del Dashboard)
// ============================================

import { useInventoryPrediction, useProductWithMetrics } from '@/hooks/useProductWithMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  RefreshCw, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  ShoppingCart,
  BarChart3,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function InventoryIA() {
  const { predictions, loading } = useInventoryPrediction();
  const { 
    refresh, 
    getTotalMetrics, 
    getTopSellers,
    getCriticalStock, 
    getLowStock, 
    getOutOfStock 
  } = useProductWithMetrics({ autoRefresh: true, refreshInterval: 60000 });
  
  const { toast } = useToast();

  const handleRefresh = async () => {
    await refresh();
    toast({
      title: "✅ Actualizado",
      description: "Predicciones actualizadas correctamente"
    });
  };

  const handleGeneratePurchaseOrder = async (pred: any) => {
    const confirmed = window.confirm(
      `¿Generar orden de compra por ${pred.suggested_reorder_qty} unidades de ${pred.nombre_producto}?`
    );
    
    if (confirmed) {
      toast({
        title: "📦 Orden generada",
        description: `${pred.suggested_reorder_qty} unidades de ${pred.nombre_producto}`,
        variant: "default"
      });
      
      await supabase.from('ai_consumption_logs').insert({
        feature: 'inventory_forecast',
        operation_type: 'purchase_order_generated',
        tokens_used: 0,
        api_calls: 1,
        cost_usd: 0,
        metadata: { 
          product_code: pred.product_code,
          quantity: pred.suggested_reorder_qty
        }
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const metrics = getTotalMetrics();
  const topSellers = getTopSellers(5);
  const criticalProducts = getCriticalStock();
  const lowStock = getLowStock(10);
  const outOfStock = getOutOfStock();

  const criticalAlerts = predictions.filter(p => p.dias_restantes <= 7 && p.stock_actual > 0);
  const warningAlerts = predictions.filter(p => p.dias_restantes > 7 && p.dias_restantes <= 14 && p.stock_actual > 0);
  const outOfStockPreds = predictions.filter(p => p.stock_actual === 0);

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              📦 Inventario Inteligente con IA
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Predicción y análisis avanzado de inventario basado en tendencias de venta
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Stock"
            value={metrics.total_stock}
            subtitle="unidades"
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Productos"
            value={metrics.total_productos}
            subtitle="en catálogo"
            icon={<BarChart3 className="w-5 h-5" />}
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
            title="Críticos"
            value={metrics.productos_criticos}
            subtitle="urgente"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Alertas de Stock */}
        {(outOfStockPreds.length > 0 || criticalAlerts.length > 0 || warningAlerts.length > 0) && (
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertas de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outOfStockPreds.length > 0 && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    ❌ {outOfStockPreds.length} productos agotados
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {outOfStockPreds.slice(0, 3).map(p => p.nombre_producto).join(', ')}
                    {outOfStockPreds.length > 3 && ` y ${outOfStockPreds.length - 3} más...`}
                  </p>
                </div>
              )}
              {criticalAlerts.length > 0 && (
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <p className="font-semibold text-orange-800 dark:text-orange-300">
                    🚨 {criticalAlerts.length} productos críticos (≤7 días)
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    {criticalAlerts.slice(0, 3).map(p => `${p.nombre_producto} (${p.dias_restantes}d)`).join(', ')}
                    {criticalAlerts.length > 3 && ` y ${criticalAlerts.length - 3} más...`}
                  </p>
                </div>
              )}
              {warningAlerts.length > 0 && (
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                    ⚠️ {warningAlerts.length} productos en advertencia (8-14 días)
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
                  {predictions.slice(0, 20).map((pred) => {
                    const isUrgent = pred.stock_actual === 0 || pred.dias_restantes <= 7;
                    const isWarning = pred.dias_restantes > 7 && pred.dias_restantes <= 14;
                    
                    return (
                      <tr 
                        key={pred.product_code} 
                        className={`
                          border-b hover:bg-gray-50 dark:hover:bg-gray-800
                          ${pred.stock_actual === 0 ? 'bg-red-50 dark:bg-red-950/10' : ''}
                          ${isUrgent && pred.stock_actual > 0 ? 'bg-orange-50 dark:bg-orange-950/10' : ''}
                          ${isWarning ? 'bg-yellow-50 dark:bg-yellow-950/10' : ''}
                        `}
                      >
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
                          <DaysRemainingBadge days={pred.dias_restantes} stock={pred.stock_actual} />
                        </td>
                        <td className="text-center p-3">
                          <ConfidenceBadge confidence={pred.confianza} />
                        </td>
                        <td className="text-center p-3">
                          {(pred.stock_actual === 0 || pred.dias_restantes <= 14) ? (
                            <Button
                              onClick={() => handleGeneratePurchaseOrder(pred)}
                              size="sm"
                              variant={pred.stock_actual === 0 ? "destructive" : "default"}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Comprar {pred.suggested_reorder_qty}
                            </Button>
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                <div key={product.code} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
    </AdminLayout>
  );
}

// ============================================
// COMPONENTES AUXILIARES
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
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
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
    return <Badge variant="destructive" className="font-bold">Agotado</Badge>;
  }
  if (stock <= 10) {
    return (
      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 font-semibold">
        {stock}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 font-semibold">
      {stock}
    </Badge>
  );
}

function DaysRemainingBadge({ days, stock }: { days: number; stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">0 días</Badge>;
  }
  if (days <= 7) {
    return <Badge variant="destructive" className="font-semibold">{days} días</Badge>;
  }
  if (days <= 14) {
    return (
      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 font-semibold">
        {days} días
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 font-semibold">
      {days > 100 ? '30+' : days} días
    </Badge>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  
  if (confidence >= 0.85) {
    return (
      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
        🟢 {percentage}%
      </Badge>
    );
  }
  if (confidence >= 0.70) {
    return (
      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700">
        🔵 {percentage}%
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700">
      ⚪ {percentage}%
    </Badge>
  );
}
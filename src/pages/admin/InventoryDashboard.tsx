import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useProductWithMetrics, useInventoryPrediction } from '@/hooks/useProductWithMetrics';
import { 
  Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  RefreshCw, Sparkles, BarChart3, Bell, ShoppingCart, Database,
  Loader2, DollarSign, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function InventoryDashboard() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [predictingAI, setPredictingAI] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [aiNotifications, setAINotifications] = useState<any[]>([]);

  const { 
    products: productsMetrics, 
    loading, 
    getTotalMetrics,
    getTopSellers,
    getLowStock,
    getOutOfStock,
    getCriticalStock,
    refresh 
  } = useProductWithMetrics({ autoRefresh: false });

  const { predictions, loading: predictionsLoading } = useInventoryPrediction();

  const metrics = getTotalMetrics();
  const topSellers = getTopSellers(5);
  const lowStock = getLowStock(10);
  const outOfStock = getOutOfStock();
  const criticalStock = getCriticalStock();

  useEffect(() => {
    loadAINotifications();
  }, [predictions]);

  const loadAINotifications = () => {
    const notifications: any[] = [];

    // Alertas críticas de stock
    criticalStock.forEach(product => {
      notifications.push({
        id: `critical-${product.code}`,
        type: 'critical',
        title: '🚨 Stock Crítico',
        message: `${product.name}: Solo ${product.dias_restantes_stock} días de stock`,
        product: product.name,
        action: 'Ordenar urgente',
        priority: 1
      });
    });

    // Alertas de productos agotados
    outOfStock.forEach(product => {
      notifications.push({
        id: `outofstock-${product.code}`,
        type: 'urgent',
        title: '❌ Producto Agotado',
        message: `${product.name} está sin stock`,
        product: product.name,
        action: 'Reabastecer ahora',
        priority: 1
      });
    });

    // Alertas de bajo stock
    lowStock.slice(0, 5).forEach(product => {
      notifications.push({
        id: `low-${product.code}`,
        type: 'warning',
        title: '⚠️ Stock Bajo',
        message: `${product.name}: ${product.cantidad_stock} unidades restantes`,
        product: product.name,
        action: 'Planificar pedido',
        priority: 2
      });
    });

    // Alertas de productos con alta conversión
    const highPerformers = productsMetrics
      .filter(p => p.conversion_rate > 5 && p.cantidad_stock < 30)
      .slice(0, 3);

    highPerformers.forEach(product => {
      notifications.push({
        id: `performance-${product.code}`,
        type: 'opportunity',
        title: '⭐ Oportunidad de Venta',
        message: `${product.name} tiene ${product.conversion_rate.toFixed(1)}% conversión pero stock bajo`,
        product: product.name,
        action: 'Aumentar stock',
        priority: 2
      });
    });

    // Ordenar por prioridad
    notifications.sort((a, b) => a.priority - b.priority);
    setAINotifications(notifications.slice(0, 10));
  };

  const handleSyncProducts = async () => {
    try {
      setSyncing(true);
      toast({
        title: '⚠️ Función no disponible',
        description: 'La sincronización de productos estáticos ya no es necesaria. Todos los productos ahora se gestionan directamente desde la base de datos.',
        variant: 'default',
      });
    } finally {
      setSyncing(false);
    }
  };


  const handleRunAIPrediction = async () => {
    try {
      setPredictingAI(true);
      
      const { data, error } = await supabase.functions.invoke('predict-inventory');

      if (error) throw error;

      await refresh();
      
      toast({
        title: '🤖 Predicción IA Completada',
        description: `${data.forecasts_generated} pronósticos generados. ${data.critical_alerts} alertas críticas.`,
      });

      loadAINotifications();
    } catch (error) {
      console.error('Error running prediction:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo ejecutar la predicción de IA',
        variant: 'destructive',
      });
    } finally {
      setPredictingAI(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8 text-primary" />
              Dashboard de Inventario Inteligente
            </h1>
            <p className="text-muted-foreground mt-2">
              Control completo de stock con predicciones de IA y notificaciones inteligentes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSyncProducts} disabled={syncing} variant="outline">
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Sincronizar
            </Button>
            <Button onClick={handleRunAIPrediction} disabled={predictingAI}>
              {predictingAI ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Ejecutar IA
            </Button>
            <Button onClick={refresh} variant="ghost">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Productos"
            value={metrics.total_productos}
            icon={<Package className="w-5 h-5" />}
            trend={null}
            color="blue"
          />
          <KPICard
            title="Stock Total"
            value={metrics.total_stock}
            subtitle="unidades"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={null}
            color="green"
          />
          <KPICard
            title="Ingresos Totales"
            value={`S/ ${metrics.total_ingresos.toFixed(0)}`}
            icon={<DollarSign className="w-5 h-5" />}
            trend={null}
            color="emerald"
          />
          <KPICard
            title="Productos Críticos"
            value={metrics.productos_criticos}
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={null}
            color="red"
          />
          <KPICard
            title="Conversión Promedio"
            value={`${metrics.conversion_rate_promedio.toFixed(1)}%`}
            icon={<Activity className="w-5 h-5" />}
            trend={null}
            color="purple"
          />
        </div>

        {/* Notificaciones IA */}
        {aiNotifications.length > 0 && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificaciones Inteligentes ({aiNotifications.length})
              </CardTitle>
              <CardDescription>
                Alertas generadas por IA basadas en tu inventario y ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {aiNotifications.map((notif) => (
                  <Alert 
                    key={notif.id} 
                    className={`
                      ${notif.type === 'critical' ? 'border-red-500 bg-red-50' : ''}
                      ${notif.type === 'urgent' ? 'border-orange-500 bg-orange-50' : ''}
                      ${notif.type === 'warning' ? 'border-yellow-500 bg-yellow-50' : ''}
                      ${notif.type === 'opportunity' ? 'border-green-500 bg-green-50' : ''}
                    `}
                  >
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{notif.title}</p>
                        <p className="text-sm">{notif.message}</p>
                      </div>
                      <Badge variant="outline">{notif.action}</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Principal */}
        <Tabs defaultValue="predictions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="predictions">
              <Sparkles className="w-4 h-4 mr-2" />
              Predicciones IA
            </TabsTrigger>
            <TabsTrigger value="stock">
              <Package className="w-4 h-4 mr-2" />
              Control de Stock
            </TabsTrigger>
            <TabsTrigger value="sales">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Análisis de Ventas
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tab: Predicciones IA */}
          <TabsContent value="predictions" className="space-y-4">
            <PredictionsTable predictions={predictions} loading={predictionsLoading} />
          </TabsContent>

          {/* Tab: Control de Stock */}
          <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StockAlertsCard
                criticalStock={criticalStock}
                lowStock={lowStock}
                outOfStock={outOfStock}
              />
              <StockDistributionCard products={productsMetrics} />
            </div>
          </TabsContent>

          {/* Tab: Análisis de Ventas */}
          <TabsContent value="sales" className="space-y-4">
            <TopSellersCard topSellers={topSellers} />
          </TabsContent>

          {/* Tab: Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsCards metrics={metrics} productsMetrics={productsMetrics} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

function KPICard({ title, value, subtitle, icon, trend, color }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionsTable({ predictions, loading }: any) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const criticalPredictions = predictions.filter((p: any) => p.dias_restantes <= 7);
  const warningPredictions = predictions.filter((p: any) => p.dias_restantes > 7 && p.dias_restantes <= 14);

  return (
    <div className="space-y-4">
      {criticalPredictions.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <p className="font-semibold text-red-900">
              🚨 {criticalPredictions.length} productos en estado crítico (≤7 días)
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Pronóstico de Inventario (Próximos 7-30 días)
          </CardTitle>
          <CardDescription>
            Predicciones basadas en histórico de ventas y tendencias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Producto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Demanda 7d</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Días Rest.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Confianza</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Acción Sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {predictions.slice(0, 20).map((pred: any) => (
                  <tr 
                    key={pred.product_code}
                    className={`
                      ${pred.dias_restantes <= 7 ? 'bg-red-50' : ''}
                      ${pred.dias_restantes > 7 && pred.dias_restantes <= 14 ? 'bg-yellow-50' : ''}
                      hover:bg-muted/50
                    `}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{pred.nombre_producto}</p>
                        <p className="text-xs text-muted-foreground">{pred.product_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge 
                        variant={pred.stock_actual === 0 ? 'destructive' : pred.stock_actual < 10 ? 'outline' : 'secondary'}
                        className={pred.stock_actual < 10 && pred.stock_actual > 0 ? 'bg-yellow-100 text-yellow-800' : ''}
                      >
                        {pred.stock_actual}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {pred.demanda_7d}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge 
                        variant={pred.dias_restantes <= 7 ? 'destructive' : pred.dias_restantes <= 14 ? 'outline' : 'secondary'}
                        className={pred.dias_restantes > 7 && pred.dias_restantes <= 14 ? 'bg-yellow-100 text-yellow-800' : ''}
                      >
                        {pred.dias_restantes}d
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm">{Math.round(pred.confianza * 100)}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge 
                        variant={pred.accion.includes('urgente') ? 'destructive' : 'outline'}
                        className="whitespace-nowrap"
                      >
                        {pred.accion}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StockAlertsCard({ criticalStock, lowStock, outOfStock }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Alertas de Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {outOfStock.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-900 mb-2">
              ❌ Productos Agotados ({outOfStock.length})
            </p>
            <ul className="space-y-1 text-sm">
              {outOfStock.slice(0, 5).map((p: any) => (
                <li key={p.code} className="text-red-700">• {p.name}</li>
              ))}
            </ul>
          </div>
        )}

        {criticalStock.length > 0 && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="font-semibold text-orange-900 mb-2">
              🚨 Stock Crítico (&lt;7 días) ({criticalStock.length})
            </p>
            <ul className="space-y-1 text-sm">
              {criticalStock.slice(0, 5).map((p: any) => (
                <li key={p.code} className="text-orange-700">
                  • {p.name}: {p.dias_restantes_stock} días
                </li>
              ))}
            </ul>
          </div>
        )}

        {lowStock.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-semibold text-yellow-900 mb-2">
              ⚠️ Stock Bajo (&lt;10 unidades) ({lowStock.length})
            </p>
            <ul className="space-y-1 text-sm">
              {lowStock.slice(0, 5).map((p: any) => (
                <li key={p.code} className="text-yellow-700">
                  • {p.name}: {p.cantidad_stock} unidades
                </li>
              ))}
            </ul>
          </div>
        )}

        {outOfStock.length === 0 && criticalStock.length === 0 && lowStock.length === 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-900 font-semibold">
              ✅ Todos los productos tienen stock saludable
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StockDistributionCard({ products }: any) {
  const healthy = products.filter((p: any) => p.cantidad_stock > 20).length;
  const medium = products.filter((p: any) => p.cantidad_stock > 10 && p.cantidad_stock <= 20).length;
  const low = products.filter((p: any) => p.cantidad_stock > 0 && p.cantidad_stock <= 10).length;
  const outOfStock = products.filter((p: any) => p.cantidad_stock === 0).length;

  const total = products.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Distribución de Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Stock Saludable (&gt;20)</span>
              <span className="text-sm font-semibold text-green-600">{healthy}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(healthy / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Stock Medio (11-20)</span>
              <span className="text-sm font-semibold text-blue-600">{medium}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(medium / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Stock Bajo (1-10)</span>
              <span className="text-sm font-semibold text-yellow-600">{low}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ width: `${(low / total) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Agotado (0)</span>
              <span className="text-sm font-semibold text-red-600">{outOfStock}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${(outOfStock / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopSellersCard({ topSellers }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Top 5 Productos Más Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topSellers.map((product: any, index: number) => (
            <div key={product.code} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <div className="flex gap-2 mt-1">
                    {product.badges.slice(0, 2).map((badge: string) => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{product.total_vendido}</p>
                <p className="text-sm text-muted-foreground">ventas</p>
                <p className="text-sm font-semibold">S/ {product.ingresos_generados.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Stock: {product.cantidad_stock}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsCards({ metrics, productsMetrics }: any) {
  const avgPrice = productsMetrics.reduce((sum: number, p: any) => sum + p.priceSale, 0) / productsMetrics.length;
  const avgStock = metrics.total_stock / metrics.total_productos;
  const totalValue = productsMetrics.reduce((sum: number, p: any) => sum + (p.priceSale * p.cantidad_stock), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Precio Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">S/ {avgPrice.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-2">Por producto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{avgStock.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground mt-2">Unidades por producto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Valor Total Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">S/ {totalValue.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground mt-2">Valor en stock</p>
        </CardContent>
      </Card>
    </div>
  );
}

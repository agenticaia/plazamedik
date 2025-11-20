import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, DollarSign, Eye, ShoppingCart, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ProductWithMetrics } from '@/hooks/useProductWithMetrics';

interface ProductHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithMetrics | null;
}

interface ProductMetrics {
  sales_7d: number;
  sales_30d: number;
  sales_total: number;
  revenue_7d: number;
  revenue_30d: number;
  revenue_total: number;
  views_7d: number;
  views_30d: number;
  conversion_rate_7d: number;
  conversion_rate_30d: number;
  conversion_rate_total: number;
  avg_daily_demand_7d: number;
  avg_daily_demand_30d: number;
}

export function ProductHistoryPanel({ open, onOpenChange, product }: ProductHistoryPanelProps) {
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && open) {
      fetchProductMetrics();
    }
  }, [product, open]);

  const fetchProductMetrics = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const now = new Date();
      const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Ventas últimos 7 días
      const { data: sales7d } = await supabase
        .from('orders')
        .select('*')
        .eq('product_code', product.code)
        .gte('created_at', date7DaysAgo.toISOString())
        .in('status', ['entregado', 'enviado']);

      // Ventas últimos 30 días
      const { data: sales30d } = await supabase
        .from('orders')
        .select('*')
        .eq('product_code', product.code)
        .gte('created_at', date30DaysAgo.toISOString())
        .in('status', ['entregado', 'enviado']);

      // Interacciones últimos 7 días (views)
      const { data: interactions7d } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('product_code', product.code)
        .eq('action', 'view')
        .gte('created_at', date7DaysAgo.toISOString());

      // Interacciones últimos 30 días
      const { data: interactions30d } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('product_code', product.code)
        .eq('action', 'view')
        .gte('created_at', date30DaysAgo.toISOString());

      const sales7dCount = sales7d?.length || 0;
      const sales30dCount = sales30d?.length || 0;
      const salesTotalCount = product.total_vendido || 0;

      const revenue7d = sales7d?.reduce((sum, order) => sum + (order.product_price || 0), 0) || 0;
      const revenue30d = sales30d?.reduce((sum, order) => sum + (order.product_price || 0), 0) || 0;
      const revenueTotal = product.ingresos_generados || 0;

      const views7d = interactions7d?.length || 0;
      const views30d = interactions30d?.length || 0;

      const conversionRate7d = views7d > 0 ? (sales7dCount / views7d) * 100 : 0;
      const conversionRate30d = views30d > 0 ? (sales30dCount / views30d) * 100 : 0;
      const conversionRateTotal = product.conversion_rate || 0;

      const avgDemand7d = sales7dCount / 7;
      const avgDemand30d = sales30dCount / 30;

      setMetrics({
        sales_7d: sales7dCount,
        sales_30d: sales30dCount,
        sales_total: salesTotalCount,
        revenue_7d: revenue7d,
        revenue_30d: revenue30d,
        revenue_total: revenueTotal,
        views_7d: views7d,
        views_30d: views30d,
        conversion_rate_7d: conversionRate7d,
        conversion_rate_30d: conversionRate30d,
        conversion_rate_total: conversionRateTotal,
        avg_daily_demand_7d: avgDemand7d,
        avg_daily_demand_30d: avgDemand30d,
      });
    } catch (error) {
      console.error('Error fetching product metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const getPerformanceStatus = () => {
    if (!metrics) return { status: 'unknown', message: 'Cargando análisis...' };

    const { sales_7d, avg_daily_demand_7d, conversion_rate_7d } = metrics;

    if (sales_7d === 0 && conversion_rate_7d === 0) {
      return {
        status: 'poor',
        message: 'Sin ventas ni interés en los últimos 7 días',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
    }

    if (avg_daily_demand_7d < 0.3 && conversion_rate_7d < 1) {
      return {
        status: 'low',
        message: 'Bajo rendimiento - Considerar descontinuar',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      };
    }

    if (avg_daily_demand_7d >= 1 && conversion_rate_7d >= 3) {
      return {
        status: 'excellent',
        message: 'Excelente rendimiento - Mantener stock',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    }

    return {
      status: 'moderate',
      message: 'Rendimiento moderado',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-2xl">Historial Completo</SheetTitle>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              {product.imagen_url && (
                <img 
                  src={product.imagen_url} 
                  alt={product.name} 
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.code}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge variant={product.stock_status === 'disponible' ? 'default' : 'destructive'}>
                    Stock: {product.cantidad_stock}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Estado de Rendimiento */}
            <Card className={performanceStatus.bgColor}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-5 h-5 ${performanceStatus.color}`} />
                  <p className={`font-semibold ${performanceStatus.color}`}>
                    {performanceStatus.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : metrics ? (
          <Tabs defaultValue="7d" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7d">7 Días</TabsTrigger>
              <TabsTrigger value="30d">30 Días</TabsTrigger>
              <TabsTrigger value="total">Todo el Tiempo</TabsTrigger>
            </TabsList>

            {/* 7 Días */}
            <TabsContent value="7d" className="space-y-4 mt-4">
              <MetricCard
                icon={<ShoppingCart className="w-5 h-5" />}
                title="Ventas"
                value={metrics.sales_7d}
                subtitle="unidades vendidas"
                trend={metrics.sales_7d > metrics.sales_30d / 4 ? 'up' : 'down'}
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5" />}
                title="Ingresos"
                value={`S/ ${metrics.revenue_7d.toFixed(2)}`}
                subtitle="ingresos generados"
              />
              <MetricCard
                icon={<Eye className="w-5 h-5" />}
                title="Visualizaciones"
                value={metrics.views_7d}
                subtitle="vistas del producto"
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Tasa de Conversión"
                value={`${metrics.conversion_rate_7d.toFixed(2)}%`}
                subtitle="conversión de vistas a ventas"
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Demanda Diaria Promedio"
                value={metrics.avg_daily_demand_7d.toFixed(2)}
                subtitle="unidades/día"
              />
            </TabsContent>

            {/* 30 Días */}
            <TabsContent value="30d" className="space-y-4 mt-4">
              <MetricCard
                icon={<ShoppingCart className="w-5 h-5" />}
                title="Ventas"
                value={metrics.sales_30d}
                subtitle="unidades vendidas"
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5" />}
                title="Ingresos"
                value={`S/ ${metrics.revenue_30d.toFixed(2)}`}
                subtitle="ingresos generados"
              />
              <MetricCard
                icon={<Eye className="w-5 h-5" />}
                title="Visualizaciones"
                value={metrics.views_30d}
                subtitle="vistas del producto"
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Tasa de Conversión"
                value={`${metrics.conversion_rate_30d.toFixed(2)}%`}
                subtitle="conversión de vistas a ventas"
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Demanda Diaria Promedio"
                value={metrics.avg_daily_demand_30d.toFixed(2)}
                subtitle="unidades/día"
              />
            </TabsContent>

            {/* Todo el Tiempo */}
            <TabsContent value="total" className="space-y-4 mt-4">
              <MetricCard
                icon={<ShoppingCart className="w-5 h-5" />}
                title="Ventas Totales"
                value={metrics.sales_total}
                subtitle="unidades vendidas"
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5" />}
                title="Ingresos Totales"
                value={`S/ ${metrics.revenue_total.toFixed(2)}`}
                subtitle="ingresos generados"
              />
              <MetricCard
                icon={<Eye className="w-5 h-5" />}
                title="Visualizaciones Totales"
                value={product.total_views || 0}
                subtitle="vistas acumuladas"
              />
              <MetricCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Tasa de Conversión"
                value={`${metrics.conversion_rate_total.toFixed(2)}%`}
                subtitle="conversión histórica"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          {trend && (
            <div className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend === 'up' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

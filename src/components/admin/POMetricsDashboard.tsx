import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, UserCheck, Clock, TrendingUp, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface POMetrics {
  total_automatic: number;
  total_manual: number;
  avg_response_time_hours: number;
  critical_pos: number;
  total_value_automatic: number;
  total_value_manual: number;
}

export const POMetricsDashboard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['po-metrics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all POs from last 30 days
      const { data: allPOs, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Calculate metrics
      const automatic = allPOs?.filter((po) => po.order_type === 'automatica') || [];
      const manual = allPOs?.filter((po) => po.order_type === 'manual') || [];

      // Calculate average response time (created_at to when status changed from DRAFT)
      const responseTimes: number[] = [];
      automatic.forEach((po) => {
        if (po.status !== 'DRAFT' && po.updated_at) {
          const created = new Date(po.created_at!).getTime();
          const updated = new Date(po.updated_at).getTime();
          const diffHours = (updated - created) / (1000 * 60 * 60);
          responseTimes.push(diffHours);
        }
      });

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

      const criticalPOs = automatic.filter(
        (po) => (po.priority === 'URGENT' || po.priority === 'HIGH') && po.status === 'DRAFT'
      ).length;

      const totalValueAutomatic = automatic.reduce((sum, po) => sum + (po.total_amount || 0), 0);
      const totalValueManual = manual.reduce((sum, po) => sum + (po.total_amount || 0), 0);

      return {
        total_automatic: automatic.length,
        total_manual: manual.length,
        avg_response_time_hours: Math.round(avgResponseTime * 10) / 10,
        critical_pos: criticalPOs,
        total_value_automatic: totalValueAutomatic,
        total_value_manual: totalValueManual,
      } as POMetrics;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de POs (últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando métricas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const totalPOs = metrics.total_automatic + metrics.total_manual;
  const autoPercentage = totalPOs > 0 ? (metrics.total_automatic / totalPOs) * 100 : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          📊 Métricas de POs (últimos 30 días)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Row: Automatic vs Manual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="POs Automáticas"
            value={metrics.total_automatic}
            subtitle={`${autoPercentage.toFixed(0)}% del total`}
            icon={<Bot className="w-5 h-5" />}
            color="primary"
            trend="up"
          />
          <MetricCard
            title="POs Manuales"
            value={metrics.total_manual}
            subtitle={`${(100 - autoPercentage).toFixed(0)}% del total`}
            icon={<UserCheck className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Tiempo de Respuesta"
            value={`${metrics.avg_response_time_hours}h`}
            subtitle="promedio desde creación"
            icon={<Clock className="w-5 h-5" />}
            color={metrics.avg_response_time_hours < 24 ? 'green' : 'yellow'}
          />
        </div>

        {/* Critical POs Alert */}
        {metrics.critical_pos > 0 && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  {metrics.critical_pos} POs críticas pendientes de envío
                </p>
                <p className="text-sm text-muted-foreground">
                  Requieren atención inmediata para evitar quiebres de stock
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Value Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total Automático</p>
                  <p className="text-2xl font-bold text-primary">
                    S/ {metrics.total_value_automatic.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total Manual</p>
                  <p className="text-2xl font-bold">
                    S/ {metrics.total_value_manual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <UserCheck className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="font-semibold">💡 Insights:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {autoPercentage > 50 && (
              <li>✓ El sistema automatizado está manejando más de la mitad de las órdenes</li>
            )}
            {metrics.avg_response_time_hours < 12 && (
              <li>✓ Tiempo de respuesta excelente (&lt;12h)</li>
            )}
            {metrics.avg_response_time_hours > 48 && (
              <li>⚠️ Tiempo de respuesta alto, considera aumentar personal o automatización</li>
            )}
            {metrics.critical_pos === 0 && (
              <li>✓ No hay POs críticas pendientes - sistema operando eficientemente</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'blue' | 'green' | 'yellow';
  trend?: 'up' | 'down';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2 flex items-center gap-2">
              {value}
              {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-full', colorClasses[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

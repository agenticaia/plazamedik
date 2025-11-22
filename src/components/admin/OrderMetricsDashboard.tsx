import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSalesOrders } from "@/hooks/useSalesOrders";
import { Clock, TrendingUp, TrendingDown, AlertCircle, Package, CheckCircle2, BarChart3 } from "lucide-react";
import { differenceInDays, differenceInHours, format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const OrderMetricsDashboard = () => {
  const { orders } = useSalesOrders();

  // Calcular tiempo promedio de entrega
  const calculateAverageDeliveryTime = () => {
    const completedOrders = orders.filter((order: any) => 
      order.fulfillment_status === 'FULFILLED' && order.delivered_at && order.created_at
    );
    
    if (completedOrders.length === 0) return { days: 0, hours: 0, count: 0 };
    
    const totalHours = completedOrders.reduce((acc: number, order: any) => {
      const hours = differenceInHours(
        new Date(order.delivered_at),
        new Date(order.created_at)
      );
      return acc + hours;
    }, 0);
    
    const avgHours = totalHours / completedOrders.length;
    const days = Math.floor(avgHours / 24);
    const hours = Math.round(avgHours % 24);
    
    return { days, hours, count: completedOrders.length };
  };

  // Órdenes completadas vs pendientes
  const getOrderStatusSummary = () => {
    const completed = orders.filter((order: any) => order.fulfillment_status === 'FULFILLED').length;
    const pending = orders.filter((order: any) => 
      ['UNFULFILLED', 'PARTIAL', 'WAITING_STOCK'].includes(order.fulfillment_status)
    ).length;
    const total = orders.length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    
    return { completed, pending, total, completionRate };
  };

  // Análisis de demoras
  const getDelayAnalysis = () => {
    const now = new Date();
    const delayedOrders = orders.filter((order: any) => {
      if (order.fulfillment_status === 'FULFILLED' || order.fulfillment_status === 'CANCELLED') {
        return false;
      }
      
      const orderAge = differenceInDays(now, new Date(order.created_at));
      // Consideramos "demorado" si tiene más de 3 días sin completar
      return orderAge > 3;
    });

    const criticalDelays = delayedOrders.filter((order: any) => {
      const orderAge = differenceInDays(now, new Date(order.created_at));
      return orderAge > 7; // Más de 7 días = crítico
    });

    return {
      delayed: delayedOrders.length,
      critical: criticalDelays.length,
      delayedOrders: delayedOrders.map((order: any) => ({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        daysOld: differenceInDays(now, new Date(order.created_at)),
        status: order.fulfillment_status,
      }))
    };
  };

  // Pedidos en tránsito
  const getInTransitOrders = () => {
    return orders.filter((order: any) => 
      order.shipped_at && !order.delivered_at
    ).length;
  };

  // Tendencias de entregas por día (últimos 30 días)
  const getDeliveryTrendsByDay = () => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const delivered = orders.filter((order: any) => {
        if (!order.delivered_at) return false;
        const deliveredDate = format(new Date(order.delivered_at), 'yyyy-MM-dd');
        return deliveredDate === dayStr;
      }).length;

      const created = orders.filter((order: any) => {
        const createdDate = format(new Date(order.created_at), 'yyyy-MM-dd');
        return createdDate === dayStr;
      }).length;

      return {
        date: format(day, 'dd/MM', { locale: es }),
        entregados: delivered,
        creados: created
      };
    });
  };

  // Tendencias por semana (últimas 8 semanas)
  const getDeliveryTrendsByWeek = () => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const delivered = orders.filter((order: any) => {
        if (!order.delivered_at) return false;
        const deliveredDate = new Date(order.delivered_at);
        return deliveredDate >= weekStart && deliveredDate <= weekEnd;
      }).length;

      const created = orders.filter((order: any) => {
        const createdDate = new Date(order.created_at);
        return createdDate >= weekStart && createdDate <= weekEnd;
      }).length;

      weeks.push({
        semana: `Sem ${format(weekStart, 'dd/MM')}`,
        entregados: delivered,
        creados: created
      });
    }
    return weeks;
  };

  const avgDelivery = calculateAverageDeliveryTime();
  const statusSummary = getOrderStatusSummary();
  const delayAnalysis = getDelayAnalysis();
  const inTransit = getInTransitOrders();
  const dailyTrends = getDeliveryTrendsByDay();
  const weeklyTrends = getDeliveryTrendsByWeek();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Métricas de Pedidos</h2>
          <p className="text-sm text-muted-foreground">
            Análisis de tiempos, cumplimiento y demoras
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tiempo promedio de entrega */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo Promedio Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {avgDelivery.days}d {avgDelivery.hours}h
              </div>
              <p className="text-xs text-muted-foreground">
                Basado en {avgDelivery.count} pedidos completados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tasa de completitud */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Tasa de Cumplimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-green-600">
                {statusSummary.completionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {statusSummary.completed} de {statusSummary.total} completados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos con demora */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pedidos con Demora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-amber-600">
                  {delayAnalysis.delayed}
                </div>
                {delayAnalysis.critical > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {delayAnalysis.critical} críticos
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Más de 3 días sin completar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* En tránsito */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              En Tránsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-blue-600">
                {inTransit}
              </div>
              <p className="text-xs text-muted-foreground">
                Enviados, pendientes de entrega
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de pedidos demorados */}
      {delayAnalysis.delayed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Pedidos Demorados - Atención Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {delayAnalysis.delayedOrders.slice(0, 5).map((order: any) => (
                <div 
                  key={order.orderNumber}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {order.orderNumber}
                      </span>
                      {order.daysOld > 7 && (
                        <Badge variant="destructive" className="text-xs">
                          CRÍTICO
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-amber-600">
                        {order.daysOld}
                      </span>
                      <span className="text-sm text-muted-foreground">días</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {delayAnalysis.delayedOrders.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  +{delayAnalysis.delayedOrders.length - 5} pedidos más con demora
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia diaria (últimos 30 días) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Entregas por Día (Últimos 30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="entregados" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Entregados"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="creados" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Creados"
                  dot={{ fill: 'hsl(var(--muted-foreground))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendencia semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Entregas por Semana (Últimas 8 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="semana" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="entregados" 
                  fill="hsl(var(--primary))" 
                  name="Entregados"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="creados" 
                  fill="hsl(var(--muted-foreground))" 
                  name="Creados"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparación período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{statusSummary.pending}</span>
                <Badge variant="secondary" className="text-xs">
                  {statusSummary.total > 0 
                    ? ((statusSummary.pending / statusSummary.total) * 100).toFixed(0)
                    : '0'}%
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completados</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {statusSummary.completed}
                </span>
                <Badge variant="default" className="text-xs">
                  {statusSummary.completionRate}%
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Eficiencia de Entrega</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {avgDelivery.days < 2 ? '🎯' : avgDelivery.days < 4 ? '✅' : '⚠️'}
                </span>
                <span className="text-sm">
                  {avgDelivery.days < 2 ? 'Excelente' : avgDelivery.days < 4 ? 'Bueno' : 'Mejorable'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

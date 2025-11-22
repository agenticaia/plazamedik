import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentSummary } from "@/hooks/usePaymentDashboard";

interface CashFlowProjectionChartProps {
  paymentSummary?: PaymentSummary[];
  isLoading: boolean;
}

export const CashFlowProjectionChart = ({ paymentSummary, isLoading }: CashFlowProjectionChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proyección de Flujo de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!paymentSummary || paymentSummary.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Proyección de Flujo de Caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Generate next 12 weeks projection
  const weeks = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), i);
    const weekEnd = addDays(weekStart, 6);

    // Calculate payments due this week
    const dueThisWeek = paymentSummary
      .filter((po) => {
        if (!po.expected_delivery_date) return false;
        const dueDate = new Date(po.expected_delivery_date);
        return dueDate >= weekStart && dueDate <= weekEnd;
      })
      .reduce((sum, po) => sum + po.balance_due, 0);

    // Calculate overdue payments
    const overdueThisWeek = paymentSummary
      .filter((po) => {
        if (po.payment_status !== "OVERDUE") return false;
        return true; // All overdue should be paid
      })
      .reduce((sum, po) => sum + po.balance_due, 0);

    weeks.push({
      week: format(weekStart, "dd MMM", { locale: es }),
      pagos_programados: parseFloat(dueThisWeek.toFixed(2)),
      pagos_vencidos: i === 0 ? parseFloat(overdueThisWeek.toFixed(2)) : 0,
      total: parseFloat((dueThisWeek + (i === 0 ? overdueThisWeek : 0)).toFixed(2)),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Proyección de Flujo de Caja (Próximas 12 Semanas)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Estimación de salidas de efectivo basada en fechas de entrega esperadas
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={weeks}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="week"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
            />
            <Legend />
            <Bar
              dataKey="pagos_programados"
              fill="hsl(var(--primary))"
              name="Pagos Programados"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pagos_vencidos"
              fill="hsl(var(--destructive))"
              name="Pagos Vencidos"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Total Semanal"
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Esta Semana</div>
            <div className="text-lg font-bold">
              S/ {weeks[0]?.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Próximos 30 Días</div>
            <div className="text-lg font-bold text-amber-600">
              S/{" "}
              {weeks
                .slice(0, 4)
                .reduce((sum, w) => sum + w.total, 0)
                .toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Próximos 90 Días</div>
            <div className="text-lg font-bold text-blue-600">
              S/ {weeks.reduce((sum, w) => sum + w.total, 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

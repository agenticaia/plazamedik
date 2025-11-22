import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface RevenueConversionScatterProps {
  products?: Array<{
    product_code: string;
    nombre_producto: string;
    precio: number;
    total_vendido: number;
    total_views: number;
  }>;
  isLoading: boolean;
}

export const RevenueConversionScatter = ({ products, isLoading }: RevenueConversionScatterProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis de Ingresos vs. Conversión
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
            <TrendingUp className="h-5 w-5" />
            Análisis de Ingresos vs. Conversión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics for each product
  const chartData = products
    .filter((p) => p.total_views > 0) // Only products with views
    .map((product) => {
      const conversionRate = (product.total_vendido / product.total_views) * 100;
      const revenue = product.precio * product.total_vendido;
      return {
        name: product.nombre_producto,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        revenue: revenue,
        productCode: product.product_code,
      };
    })
    .filter((p) => p.revenue > 0); // Only products with sales

  // Determine color based on performance quadrants
  const getColor = (conversionRate: number, revenue: number) => {
    const avgConversion = chartData.reduce((sum, p) => sum + p.conversionRate, 0) / chartData.length;
    const avgRevenue = chartData.reduce((sum, p) => sum + p.revenue, 0) / chartData.length;

    if (conversionRate >= avgConversion && revenue >= avgRevenue) {
      return "hsl(142, 76%, 36%)"; // Green - High performers
    } else if (conversionRate < avgConversion && revenue < avgRevenue) {
      return "hsl(var(--destructive))"; // Red - Underperformers
    } else {
      return "hsl(45, 93%, 47%)"; // Amber - Mixed performance
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
          Análisis de Ingresos vs. Conversión
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gráfico de dispersión de rendimiento de productos - pase el cursor para ver detalles
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="conversionRate"
              name="Tasa de Conversión"
              unit="%"
              label={{ value: "Tasa de Conversión (%)", position: "insideBottom", offset: -10 }}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              type="number"
              dataKey="revenue"
              name="Ingresos"
              unit="$"
              label={{ value: "Ingresos ($)", angle: -90, position: "insideLeft" }}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm mb-1">{data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: {data.productCode}
                      </p>
                      <p className="text-xs mt-1">
                        Conversión: <span className="font-semibold">{data.conversionRate}%</span>
                      </p>
                      <p className="text-xs">
                        Ingresos: <span className="font-semibold">${data.revenue.toLocaleString()}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter data={chartData} fill="hsl(var(--primary))">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.conversionRate, entry.revenue)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-600" />
            <span className="text-muted-foreground">Alto Rendimiento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-600" />
            <span className="text-muted-foreground">Rendimiento Mixto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Bajo Rendimiento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

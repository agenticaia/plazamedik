import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface InventoryRiskChartProps {
  products?: Array<{
    product_code: string;
    nombre_producto: string;
    cantidad_stock: number;
    total_vendido: number;
  }>;
  isLoading: boolean;
}

export const InventoryRiskChart = ({ products, isLoading }: InventoryRiskChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Proyección de Riesgo de Inventario (Próximos 30 Días)
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
            <AlertTriangle className="h-5 w-5" />
            Proyección de Riesgo de Inventario (Próximos 30 Días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate days remaining for each product
  const categorizedProducts = products.map((product) => {
    const demandadiaria = product.total_vendido > 0 ? product.total_vendido / 30 : 0;
    const diasRestantes =
      demandadiaria > 0 ? Math.floor(product.cantidad_stock / demandadiaria) : 999;
    
    return {
      ...product,
      diasRestantes,
    };
  });

  // Categorize into risk levels
  const urgent = categorizedProducts.filter((p) => p.diasRestantes <= 7).length;
  const warning = categorizedProducts.filter((p) => p.diasRestantes > 7 && p.diasRestantes <= 14).length;
  const healthy = categorizedProducts.filter((p) => p.diasRestantes > 14).length;

  const data = [
    { name: "🔴 Urgente (0-7 días)", value: urgent, color: "hsl(var(--destructive))" },
    { name: "🟡 Advertencia (8-14 días)", value: warning, color: "hsl(45, 93%, 47%)" },
    { name: "🟢 Saludable (15+ días)", value: healthy, color: "hsl(142, 76%, 36%)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Proyección de Riesgo de Inventario (Próximos 30 Días)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Productos categorizados por días estimados hasta agotamiento
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{urgent}</div>
            <div className="text-xs text-muted-foreground">Urgente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{warning}</div>
            <div className="text-xs text-muted-foreground">Advertencia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthy}</div>
            <div className="text-xs text-muted-foreground">Saludable</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

interface SupplierBalanceChartProps {
  bySupplier: Array<{
    supplier_name: string;
    total_outstanding: number;
    total_overdue: number;
    order_count: number;
  }>;
  isLoading: boolean;
}

export const SupplierBalanceChart = ({ bySupplier, isLoading }: SupplierBalanceChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance por Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!bySupplier || bySupplier.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Balance por Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by total outstanding and take top 10
  const topSuppliers = [...bySupplier]
    .sort((a, b) => b.total_outstanding - a.total_outstanding)
    .slice(0, 10)
    .map((supplier) => ({
      name: supplier.supplier_name.length > 20 
        ? supplier.supplier_name.substring(0, 20) + "..."
        : supplier.supplier_name,
      fullName: supplier.supplier_name,
      pendiente: parseFloat(supplier.total_outstanding.toFixed(2)),
      vencido: parseFloat(supplier.total_overdue.toFixed(2)),
      ordenes: supplier.order_count,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Balance por Proveedor (Top 10)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Proveedores con mayor balance pendiente de pago
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topSuppliers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              width={120}
            />
            <Tooltip
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
                      <p className="font-semibold text-sm mb-2">{data.fullName}</p>
                      <p className="text-xs">
                        Pendiente: <span className="font-semibold text-amber-600">S/ {data.pendiente.toLocaleString("es-PE")}</span>
                      </p>
                      <p className="text-xs">
                        Vencido: <span className="font-semibold text-destructive">S/ {data.vencido.toLocaleString("es-PE")}</span>
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {data.ordenes} {data.ordenes === 1 ? "orden" : "órdenes"}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="pendiente" stackId="a" fill="hsl(var(--primary))" name="Pendiente" radius={[0, 4, 4, 0]} />
            <Bar dataKey="vencido" stackId="a" fill="hsl(var(--destructive))" name="Vencido" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

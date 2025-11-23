import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, DollarSign, Package, ShoppingCart, 
  Calendar, ArrowUp, ArrowDown, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlySales {
  month: string;
  total: number;
  orders: number;
  avgOrderValue: number;
}

interface ProductSales {
  name: string;
  sales: number;
  revenue: number;
}

interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  monthlyGrowth: number;
}

export default function SalesStatistics() {
  const [loading, setLoading] = useState(true);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    monthlyGrowth: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "6m" | "12m">("30d");

  const loadStatistics = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      if (selectedPeriod === "7d") {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (selectedPeriod === "30d") {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else {
        const months = selectedPeriod === "6m" ? 6 : 12;
        startDate = subMonths(new Date(), months);
      }

      // Cargar ventas mensuales de sales_orders
      const { data: salesOrders, error: salesError } = await supabase
        .from("sales_orders")
        .select("total, created_at, order_number")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (salesError) throw salesError;

      // Cargar también orders legacy para completar datos
      const { data: legacyOrders, error: legacyError } = await supabase
        .from("orders")
        .select("product_price, created_at, order_code, product_name")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (legacyError) throw legacyError;

      // Procesar datos por período (días o meses)
      const periodData: { [key: string]: { total: number; orders: number } } = {};
      const isDaily = selectedPeriod === "7d" || selectedPeriod === "30d";
      
      salesOrders?.forEach((order) => {
        const periodKey = isDaily 
          ? format(new Date(order.created_at), "dd MMM", { locale: es })
          : format(new Date(order.created_at), "MMM yyyy", { locale: es });
        if (!periodData[periodKey]) {
          periodData[periodKey] = { total: 0, orders: 0 };
        }
        periodData[periodKey].total += Number(order.total);
        periodData[periodKey].orders += 1;
      });

      legacyOrders?.forEach((order) => {
        const periodKey = isDaily 
          ? format(new Date(order.created_at), "dd MMM", { locale: es })
          : format(new Date(order.created_at), "MMM yyyy", { locale: es });
        if (!periodData[periodKey]) {
          periodData[periodKey] = { total: 0, orders: 0 };
        }
        periodData[periodKey].total += Number(order.product_price);
        periodData[periodKey].orders += 1;
      });

      const periodArray: MonthlySales[] = Object.entries(periodData).map(([month, data]) => ({
        month,
        total: data.total,
        orders: data.orders,
        avgOrderValue: data.orders > 0 ? data.total / data.orders : 0,
      }));

      setMonthlySales(periodArray);

      // Calcular estadísticas generales
      const totalRevenue = periodArray.reduce((sum, m) => sum + m.total, 0);
      const totalOrders = periodArray.reduce((sum, m) => sum + m.orders, 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calcular crecimiento del período
      let monthlyGrowth = 0;
      if (periodArray.length >= 2) {
        const lastPeriod = periodArray[periodArray.length - 1].total;
        const previousPeriod = periodArray[periodArray.length - 2].total;
        monthlyGrowth = previousPeriod > 0 
          ? ((lastPeriod - previousPeriod) / previousPeriod) * 100 
          : 0;
      }

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        monthlyGrowth,
      });

      // Productos más vendidos
      const productSales: { [key: string]: ProductSales } = {};

      // Contar desde sales_order_items
      const { data: orderItems } = await supabase
        .from("sales_order_items")
        .select("product_name, quantity, unit_price")
        .gte("created_at", startDate.toISOString());

      orderItems?.forEach((item) => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = {
            name: item.product_name,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[item.product_name].sales += item.quantity;
        productSales[item.product_name].revenue += item.quantity * Number(item.unit_price);
      });

      // Contar desde orders legacy
      legacyOrders?.forEach((order) => {
        if (!productSales[order.product_name]) {
          productSales[order.product_name] = {
            name: order.product_name,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[order.product_name].sales += 1;
        productSales[order.product_name].revenue += Number(order.product_price);
      });

      const topProductsArray = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setTopProducts(topProductsArray);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--destructive))",
    "hsl(var(--accent))",
    "hsl(142, 76%, 36%)",
    "hsl(45, 93%, 47%)",
    "hsl(217, 91%, 60%)",
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              Estadísticas de Ventas
            </h1>
            <p className="text-muted-foreground mt-1">
              Análisis de rendimiento mensual en soles peruanos
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedPeriod === "7d" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("7d")}
              size="sm"
            >
              7 Días
            </Button>
            <Button
              variant={selectedPeriod === "30d" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("30d")}
              size="sm"
            >
              30 Días
            </Button>
            <Button
              variant={selectedPeriod === "6m" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("6m")}
              size="sm"
            >
              6 Meses
            </Button>
            <Button
              variant={selectedPeriod === "12m" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("12m")}
              size="sm"
            >
              12 Meses
            </Button>
            <Button variant="outline" size="sm" onClick={loadStatistics}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-primary" />
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                S/ {stats.totalRevenue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos {
                  selectedPeriod === "7d" ? "7 días" :
                  selectedPeriod === "30d" ? "30 días" :
                  selectedPeriod === "6m" ? "6 meses" : "12 meses"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
                Total de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">pedidos completados</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4 text-green-600" />
                Valor Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                S/ {stats.avgOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">por pedido</p>
            </CardContent>
          </Card>

          <Card className={`border-${stats.monthlyGrowth >= 0 ? 'green' : 'red'}-500/20 bg-gradient-to-br from-${stats.monthlyGrowth >= 0 ? 'green' : 'red'}-500/5 to-transparent`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Crecimiento Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold flex items-center gap-2 ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.monthlyGrowth >= 0 ? (
                  <ArrowUp className="h-6 w-6" />
                ) : (
                  <ArrowDown className="h-6 w-6" />
                )}
                {Math.abs(stats.monthlyGrowth).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs {selectedPeriod === "7d" || selectedPeriod === "30d" ? "día anterior" : "mes anterior"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList>
            <TabsTrigger value="monthly">Ventas Mensuales</TabsTrigger>
            <TabsTrigger value="products">Productos Top</TabsTrigger>
            <TabsTrigger value="comparison">Comparación</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Ingresos Mensuales (Soles Peruanos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, "Ingresos"]}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Ingresos Totales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Tendencia de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Número de Pedidos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top 10 Productos por Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={topProducts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {topProducts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sales} unidades vendidas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            S/ {product.revenue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparación de Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="total" 
                      fill="hsl(var(--primary))" 
                      name="Ingresos (S/)"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="orders" 
                      fill="hsl(var(--chart-2))" 
                      name="Pedidos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

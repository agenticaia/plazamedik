import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingDown, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  product_code: string;
  nombre_producto: string;
  ai_reorder_point: number;
}

export const ProductSalesHistoryChart = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar productos con ROP calculado
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('product_code, nombre_producto, ai_reorder_point')
        .not('ai_reorder_point', 'is', null)
        .order('nombre_producto');
      
      if (data) {
        setProducts(data);
        if (data.length > 0) {
          setSelectedProduct(data[0].product_code);
        }
      }
    };
    loadProducts();
  }, []);

  // Cargar historial de ventas cuando cambia el producto
  useEffect(() => {
    if (!selectedProduct) return;

    const loadSalesHistory = async () => {
      setLoading(true);
      
      // Últimos 90 días
      const last90Days = eachDayOfInterval({
        start: subDays(new Date(), 89),
        end: new Date()
      });

      // Obtener ventas por día
      const { data: salesData } = await supabase
        .from('sales_order_items')
        .select(`
          quantity,
          sales_order_id,
          sales_orders!inner(created_at, fulfillment_status)
        `)
        .eq('product_code', selectedProduct)
        .gte('sales_orders.created_at', format(last90Days[0], 'yyyy-MM-dd'))
        .eq('sales_orders.fulfillment_status', 'FULFILLED');

      // Agrupar ventas por día
      const salesByDay = last90Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dailySales = salesData?.filter((item: any) => {
          const saleDate = format(new Date(item.sales_orders.created_at), 'yyyy-MM-dd');
          return saleDate === dayStr;
        }).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;

        return {
          date: format(day, 'dd/MM', { locale: es }),
          fullDate: dayStr,
          ventas: dailySales
        };
      });

      // Calcular stock simulado (empezamos con un stock inicial y vamos restando)
      const product = products.find(p => p.product_code === selectedProduct);
      const rop = product?.ai_reorder_point || 0;
      
      // Simulamos un stock inicial de 2x el ROP
      let currentStock = rop * 2;
      const dataWithStock = salesByDay.map((day) => {
        currentStock = Math.max(0, currentStock - day.ventas);
        return {
          ...day,
          stock: currentStock,
          rop: rop,
        };
      });

      setChartData(dataWithStock);
      setLoading(false);
    };

    loadSalesHistory();
  }, [selectedProduct, products]);

  const selectedProductData = products.find(p => p.product_code === selectedProduct);

  // Detectar cuándo el stock cruza la línea del ROP
  const ropCrossings = chartData.filter((point, index) => {
    if (index === 0) return false;
    const prev = chartData[index - 1];
    return prev.stock > point.rop && point.stock <= point.rop;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Historial de Ventas vs ROP
            </CardTitle>
            <CardDescription>
              Visualiza cuándo se hubiera activado el reabastecimiento automático
            </CardDescription>
          </div>
          <div className="w-[300px]">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.product_code} value={product.product_code}>
                    {product.nombre_producto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedProductData && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Punto de Reorden (ROP)</p>
              <p className="text-2xl font-bold text-primary">{selectedProductData.ai_reorder_point}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Alertas de Reabastecimiento</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-amber-600">{ropCrossings.length}</p>
                <Badge variant="secondary" className="text-xs">
                  veces en 90 días
                </Badge>
              </div>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
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
            
            {/* Línea del ROP (horizontal) */}
            <ReferenceLine 
              y={selectedProductData?.ai_reorder_point} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: 'ROP', 
                fill: 'hsl(var(--destructive))',
                position: 'right'
              }}
            />
            
            {/* Línea de stock simulado */}
            <Line 
              type="monotone" 
              dataKey="stock" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Stock Simulado"
              dot={false}
            />
            
            {/* Línea de ventas diarias */}
            <Line 
              type="monotone" 
              dataKey="ventas" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              name="Ventas Diarias"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Puntos de activación del ROP */}
        {ropCrossings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <TrendingDown className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  🎯 {ropCrossings.length} Momento{ropCrossings.length !== 1 ? 's' : ''} de Reabastecimiento Detectado{ropCrossings.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  El stock cruzó la línea del ROP en las siguientes fechas: {' '}
                  {ropCrossings.slice(0, 5).map((crossing, i) => (
                    <Badge key={i} variant="secondary" className="text-xs mr-1">
                      {crossing.date}
                    </Badge>
                  ))}
                  {ropCrossings.length > 5 && (
                    <span className="text-xs">+{ropCrossings.length - 5} más</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>💡 Nota:</strong> Este gráfico muestra un stock simulado basado en ventas reales. 
          En la realidad, el stock se repone cuando cruza el ROP. Las barras verdes muestran ventas diarias.
        </div>
      </CardContent>
    </Card>
  );
};
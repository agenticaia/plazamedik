import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ROPResult {
  products_updated: number;
  calculated_at: string;
  message: string;
}

interface ProductAlert {
  product_code: string;
  nombre_producto: string;
  cantidad_stock: number;
  ai_reorder_point: number;
}

export const ReorderPointCalculator = () => {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<ROPResult | null>(null);
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      toast.info("Calculando puntos de reorden...");

      // Llamar al edge function
      const { data, error } = await supabase.functions.invoke('calculate-reorder-points');

      if (error) throw error;

      setResult(data.result);
      setAlerts(data.alerts?.products || []);
      
      toast.success(`✅ ${data.result.products_updated} productos actualizados`);
    } catch (error) {
      console.error('Error calculando ROP:', error);
      toast.error("Error al calcular puntos de reorden");
    } finally {
      setCalculating(false);
    }
  };

  const getStockStatus = (stock: number, rop: number) => {
    const margin = stock - rop;
    const percentage = (stock / rop) * 100;

    if (margin <= 0) {
      return { variant: "destructive" as const, label: "🔴 Ordenar YA", color: "text-red-600" };
    } else if (percentage <= 120) {
      return { variant: "secondary" as const, label: "🟡 Próximo a reordenar", color: "text-yellow-600" };
    } else {
      return { variant: "default" as const, label: "🟢 Stock OK", color: "text-green-600" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Calculadora Inteligente de Punto de Reorden
              </CardTitle>
              <CardDescription>
                Sistema automático que calcula cuándo ordenar productos basándose en estadística real de ventas
              </CardDescription>
            </div>
            <Button 
              onClick={handleCalculate} 
              disabled={calculating}
              size="lg"
            >
              {calculating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Ejecutar Cálculo
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Fórmula:</strong> ROP = (Demanda durante Lead Time) + (Stock de Seguridad)
              <br />
              Usa los últimos 90 días de ventas para predecir cuándo ordenar.
            </AlertDescription>
          </Alert>

          {result && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{result.products_updated}</div>
                    <div className="text-sm text-muted-foreground">Productos Actualizados</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{alerts.length}</div>
                    <div className="text-sm text-muted-foreground">Necesitan Reorden</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {result.calculated_at ? new Date(result.calculated_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Última Actualización</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts Table */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Productos que Necesitan Reorden
            </CardTitle>
            <CardDescription>
              Stock actual ha alcanzado o está por debajo del punto de reorden calculado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Punto Reorden (AI)</TableHead>
                    <TableHead className="text-right">Déficit</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((product) => {
                    const status = getStockStatus(product.cantidad_stock, product.ai_reorder_point);
                    const deficit = product.ai_reorder_point - product.cantidad_stock;
                    
                    return (
                      <TableRow key={product.product_code}>
                        <TableCell className="font-mono text-sm">
                          {product.product_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.nombre_producto}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={status.color}>
                            {product.cantidad_stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.ai_reorder_point}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">
                            -{deficit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              // TODO: Crear PO automática
                              toast.info("Función de crear PO automática próximamente");
                            }}
                          >
                            Crear PO
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cómo Funciona el Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px]">Paso 1:</div>
              <div>Calcula <strong>ventas promedio diarias</strong> (ADS) de últimos 90 días</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px]">Paso 2:</div>
              <div>Identifica <strong>venta máxima</strong> en un solo día (MDS)</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px]">Paso 3:</div>
              <div>Usa <strong>Lead Time</strong> del proveedor + 30% buffer</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px]">Paso 4:</div>
              <div>Calcula <strong>Stock de Seguridad</strong> para cubrir picos</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px]">Paso 5:</div>
              <div><strong>ROP = Demanda Esperada + Safety Stock</strong></div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Configura un cron job para ejecutar esto automáticamente cada noche.
              Ver <code>docs/REORDER_POINT_SETUP.md</code> para instrucciones.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

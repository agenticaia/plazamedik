// Archivo: src/pages/admin/InventoryIA.tsx
// Dashboard de Predicción de Inventario con IA - REFACTORED (Actionable Command Center)

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertTriangle, Package, ShoppingCart, Clock, Target } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InventoryPrediction {
  id: string;
  product_code: string;
  nombre_producto: string;
  stock_actual: number;
  ai_reorder_point: number | null;
  sales_velocity_7d: number;
  lead_time_days: number;
  vendor_name: string | null;
  days_of_coverage: number;
  suggested_order_qty: number;
  urgency: 'critical' | 'urgent' | 'warning' | 'ok';
}

export default function InventoryIA() {
  const { data: predictions, isLoading, refetch } = useQuery({
    queryKey: ['inventory-predictions'],
    queryFn: async () => {
      // Get products with ROP calculated
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          product_code,
          nombre_producto,
          cantidad_stock,
          ai_reorder_point,
          vendor_id,
          vendors (
            name,
            lead_time_days
          )
        `)
        .or('is_discontinued.is.null,is_discontinued.eq.false')
        .not('ai_reorder_point', 'is', null)
        .order('cantidad_stock', { ascending: true });

      if (productsError) throw productsError;

      // Calculate sales velocity for last 7 days for each product
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: salesData, error: salesError } = await supabase
        .from('sales_order_items')
        .select('product_code, quantity, sales_orders!inner(created_at)')
        .gte('sales_orders.created_at', sevenDaysAgo.toISOString());

      if (salesError) throw salesError;

      // Calculate velocity per product
      const velocityMap = new Map<string, number>();
      (salesData || []).forEach((sale: any) => {
        const current = velocityMap.get(sale.product_code) || 0;
        velocityMap.set(sale.product_code, current + sale.quantity);
      });

      // Transform and calculate metrics
      const transformed: InventoryPrediction[] = (productsData || []).map((p) => {
        const vendor = p.vendors as any;
        const leadTime = vendor?.lead_time_days || 15;
        const totalSales7d = velocityMap.get(p.product_code) || 0;
        const velocity = totalSales7d / 7;
        const daysOfCoverage = velocity > 0 ? (p.cantidad_stock || 0) / velocity : 999;
        const rop = p.ai_reorder_point || 0;
        const suggestedQty = Math.max((rop * 2) - (p.cantidad_stock || 0), 0);

        // Determine urgency
        let urgency: InventoryPrediction['urgency'] = 'ok';
        if ((p.cantidad_stock || 0) === 0) {
          urgency = 'critical';
        } else if ((p.cantidad_stock || 0) <= rop) {
          urgency = 'urgent';
        } else if (daysOfCoverage < leadTime) {
          urgency = 'warning';
        }

        return {
          id: p.id,
          product_code: p.product_code,
          nombre_producto: p.nombre_producto,
          stock_actual: p.cantidad_stock || 0,
          ai_reorder_point: p.ai_reorder_point,
          sales_velocity_7d: velocity,
          lead_time_days: leadTime,
          vendor_name: vendor?.name || 'Sin proveedor',
          days_of_coverage: Math.round(daysOfCoverage),
          suggested_order_qty: Math.round(suggestedQty),
          urgency,
        };
      });

      return transformed;
    },
  });

  const handleCreatePurchaseOrder = async (prediction: InventoryPrediction) => {
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('vendor_id, precio, cost')
        .eq('product_code', prediction.product_code)
        .single();

      if (!productData?.vendor_id) {
        toast.error('Este producto no tiene proveedor asignado');
        return;
      }

      const { data: orderNumber } = await supabase.rpc('generate_po_number_sequential');
      
      const unitPrice = productData.cost || productData.precio * 0.6;
      const quantity = prediction.suggested_order_qty;
      const totalAmount = quantity * unitPrice;

      const { error } = await supabase.from('purchase_orders').insert({
        order_number: orderNumber,
        supplier_id: productData.vendor_id,
        product_code: prediction.product_code,
        product_name: prediction.nombre_producto,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        status: 'DRAFT',
        order_type: 'automatica',
        po_type: 'STOCK_REPLENISHMENT',
        priority: prediction.urgency === 'critical' ? 'URGENT' : prediction.urgency === 'urgent' ? 'HIGH' : 'NORMAL',
        notes: `Auto-generada desde Predicción IA.\nStock actual: ${prediction.stock_actual}\nPunto de reorden: ${prediction.ai_reorder_point}\nCobertura: ${prediction.days_of_coverage} días\nLead time: ${prediction.lead_time_days} días`,
      });

      if (error) throw error;

      toast.success(`✅ PO ${orderNumber} creada exitosamente`);
      refetch();
    } catch (error: any) {
      console.error('Error creating PO:', error);
      toast.error('Error al crear orden de compra: ' + error.message);
    }
  };

  // Calculate metrics
  const totalProducts = predictions?.length || 0;
  const totalStock = predictions?.reduce((sum, p) => sum + p.stock_actual, 0) || 0;
  const lowStock = predictions?.filter(p => p.stock_actual <= (p.ai_reorder_point || 0)).length || 0;
  const outOfStock = predictions?.filter(p => p.stock_actual === 0).length || 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-3xl font-bold text-foreground">🎯 Predicción de Inventario IA</h1>
            <p className="text-muted-foreground">Centro de comando accionable - Gestión por excepción</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Métricas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Productos"
            value={totalProducts}
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Stock Total"
            value={totalStock}
            subtitle="unidades"
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            title="Stock Bajo (≤ ROP)"
            value={lowStock}
            subtitle="necesitan reorden"
            icon={<Target className="w-5 h-5" />}
            color="yellow"
          />
          <MetricCard
            title="Agotados"
            value={outOfStock}
            subtitle="crítico"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Tabla de Predicciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Smart Inventory Predictions - Actionable Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">PRODUCTO</th>
                    <th className="text-center p-3 font-semibold">STOCK ACTUAL</th>
                    <th className="text-center p-3 font-semibold">ROP (AI)</th>
                    <th className="text-center p-3 font-semibold">VELOCITY vs LEAD TIME</th>
                    <th className="text-center p-3 font-semibold">DAYS OF COVERAGE</th>
                    <th className="text-center p-3 font-semibold">SUGGESTED ORDER</th>
                    <th className="text-center p-3 font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions
                    ?.sort((a, b) => {
                      // Sort by urgency first
                      const urgencyOrder = { critical: 0, urgent: 1, warning: 2, ok: 3 };
                      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                    })
                    .map((pred) => (
                      <tr
                        key={pred.id}
                        className={cn(
                          'border-b hover:bg-muted/50 transition-colors',
                          pred.urgency === 'critical' && 'bg-destructive/10',
                          pred.urgency === 'urgent' && 'bg-orange-50'
                        )}
                      >
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{pred.nombre_producto}</p>
                            <p className="text-sm text-muted-foreground">{pred.product_code}</p>
                            <p className="text-xs text-muted-foreground">{pred.vendor_name}</p>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <StockBadge stock={pred.stock_actual} />
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="outline" className="font-mono">
                            {pred.ai_reorder_point || 'N/A'}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-sm font-semibold">
                              <TrendingUp className="w-3 h-3" />
                              {pred.sales_velocity_7d.toFixed(1)}/day
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {pred.lead_time_days} days lead
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <CoverageBadge
                            coverage={pred.days_of_coverage}
                            leadTime={pred.lead_time_days}
                          />
                        </td>
                        <td className="text-center p-3">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={pred.suggested_order_qty > 0 ? 'default' : 'outline'}
                              className="font-mono"
                            >
                              {pred.suggested_order_qty} units
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Target: {(pred.ai_reorder_point || 0) * 2}
                            </span>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          {pred.suggested_order_qty > 0 ? (
                            <Button
                              size="sm"
                              variant={
                                pred.urgency === 'critical'
                                  ? 'destructive'
                                  : pred.urgency === 'urgent'
                                  ? 'default'
                                  : 'outline'
                              }
                              onClick={() => handleCreatePurchaseOrder(pred)}
                              className="gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Restock {pred.suggested_order_qty}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              ✓ Stock OK
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {predictions?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No hay productos con ROP calculado</p>
                  <p className="text-sm">Ejecuta el cálculo de ROP primero</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// ============================================
// UTILITY COMPONENTS
// ============================================

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-full', colorClasses[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="font-mono">
        0 - OUT
      </Badge>
    );
  }
  if (stock <= 10) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 font-mono">
        {stock}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 font-mono">
      {stock}
    </Badge>
  );
}

function CoverageBadge({ coverage, leadTime }: { coverage: number; leadTime: number }) {
  if (coverage === 999) {
    return (
      <Badge variant="outline" className="font-mono">
        ∞ days
      </Badge>
    );
  }

  if (coverage < leadTime) {
    return (
      <Badge variant="destructive" className="font-mono gap-1">
        <AlertTriangle className="w-3 h-3" />
        {coverage}d (Risk!)
      </Badge>
    );
  }

  if (coverage < leadTime * 1.5) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 font-mono">
        {coverage}d
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 font-mono">
      {coverage}d
    </Badge>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, TrendingUp, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ForecastData {
  id: string;
  product_code: string;
  product_name: string;
  current_stock: number;
  predicted_demand: number;
  days_until_stockout: number;
  reorder_alert: boolean;
  suggested_reorder_qty: number;
  confidence_level: 'high' | 'medium' | 'low';
  forecast_date: string;
}

export default function InventoryForecast() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('inventory_forecast')
        .select('*')
        .eq('forecast_date', today)
        .order('reorder_alert', { ascending: false })
        .order('days_until_stockout', { ascending: true });

      if (error) throw error;

      const formattedData: ForecastData[] = (data || []).map(f => ({
        id: f.id,
        product_code: f.product_code,
        product_name: f.product_code,
        current_stock: f.current_stock,
        predicted_demand: f.predicted_demand,
        days_until_stockout: f.days_until_stockout,
        reorder_alert: f.reorder_alert,
        suggested_reorder_qty: f.suggested_reorder_qty,
        confidence_level: f.confidence_level as 'high' | 'medium' | 'low',
        forecast_date: f.forecast_date
      }));

      setForecasts(formattedData);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las predicciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchForecasts();
    setRefreshing(false);
    toast({
      title: "Actualizado",
      description: "Predicciones actualizadas correctamente"
    });
  };

  const handleGeneratePurchaseOrder = async (forecast: ForecastData) => {
    const confirmed = window.confirm(
      `¿Generar orden de compra por ${forecast.suggested_reorder_qty} unidades de ${forecast.product_name}?`
    );
    
    if (confirmed) {
      toast({
        title: "Orden generada",
        description: `${forecast.suggested_reorder_qty} unidades de ${forecast.product_name}`
      });
      
      await supabase.from('ai_consumption_logs').insert({
        feature: 'forecast',
        operation_type: 'purchase_order_generated',
        tokens_used: 0,
        api_calls: 1,
        cost_usd: 0,
        metadata: { 
          product_code: forecast.product_code,
          quantity: forecast.suggested_reorder_qty
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalAlerts = forecasts.filter(f => f.reorder_alert && f.days_until_stockout < 7);
  const warningAlerts = forecasts.filter(f => f.reorder_alert && f.days_until_stockout >= 7);
  const healthyProducts = forecasts.filter(f => !f.reorder_alert);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <Package className="w-7 h-7 mr-2 text-primary" />
            Predicción de Inventario
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pronóstico basado en IA para los próximos 7-30 días
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="default"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">🚨 Alertas Urgentes (Stock Crítico &lt;7 días)</h3>
              <ul className="space-y-1">
                {criticalAlerts.map(f => (
                  <li key={f.id} className="text-sm text-red-700">
                    • <strong>{f.product_name}</strong>: Quiebre en {f.days_until_stockout} días 
                    (Stock: {f.current_stock}, Demanda: {f.predicted_demand})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {warningAlerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-2">⚠️ Advertencias (Stock Medio 7-14 días)</h3>
              <ul className="space-y-1">
                {warningAlerts.map(f => (
                  <li key={f.id} className="text-sm text-yellow-700">
                    • <strong>{f.product_name}</strong>: Quiebre en {f.days_until_stockout} días
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  Demanda 7d
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  Días Restantes
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  Confianza
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forecasts.map((f) => (
                <tr 
                  key={f.id} 
                  className={`
                    ${f.reorder_alert && f.days_until_stockout < 7 ? 'bg-red-50' : ''}
                    ${f.reorder_alert && f.days_until_stockout >= 7 ? 'bg-yellow-50' : ''}
                    hover:bg-muted/50 transition
                  `}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-foreground">
                      {f.product_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{f.product_code}</div>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-lg ${
                      f.current_stock < 10 ? 'text-red-600' : 
                      f.current_stock < 20 ? 'text-yellow-600' : 
                      'text-foreground'
                    }`}>
                      {f.current_stock}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-foreground">{f.predicted_demand}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold text-lg ${
                      f.days_until_stockout < 7 ? 'text-red-600' : 
                      f.days_until_stockout < 14 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {f.days_until_stockout}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">días</span>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      f.confidence_level === 'high' ? 'bg-green-100 text-green-800' :
                      f.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {f.confidence_level === 'high' ? '🟢 Alta' :
                       f.confidence_level === 'medium' ? '🟡 Media' : '⚪ Baja'}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-center">
                    {f.reorder_alert ? (
                      <Button
                        onClick={() => handleGeneratePurchaseOrder(f)}
                        size="sm"
                        variant="default"
                      >
                        <Package className="w-3 h-3 mr-1" />
                        Comprar {f.suggested_reorder_qty}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {healthyProducts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            <strong>{healthyProducts.length} productos</strong> con stock saludable (sin alertas)
          </p>
        </div>
      )}
    </div>
  );
}

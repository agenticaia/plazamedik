import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProductWithMetrics } from '@/hooks/useProductWithMetrics';

interface DiscontinueProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithMetrics | null;
  performanceData?: {
    sales_7d: number;
    sales_30d: number;
    conversion_rate_7d: number;
    avg_daily_demand_7d: number;
  };
  onSuccess?: () => void;
}

export function DiscontinueProductDialog({
  open,
  onOpenChange,
  product,
  performanceData,
  onSuccess,
}: DiscontinueProductDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDiscontinue = async () => {
    if (!product) return;

    if (!reason.trim()) {
      toast.error('Debes proporcionar una razón para descontinuar el producto');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_discontinued: true,
          discontinued_at: new Date().toISOString(),
          discontinue_reason: reason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('product_code', product.code);

      if (error) throw error;

      toast.success(`Producto "${product.name}" descontinuado exitosamente`);
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error discontinuing product:', error);
      toast.error('Error al descontinuar producto: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  const getRecommendation = () => {
    if (!performanceData) return null;

    const { sales_7d, sales_30d, conversion_rate_7d, avg_daily_demand_7d } = performanceData;

    if (sales_7d === 0 && conversion_rate_7d === 0) {
      return {
        level: 'critical',
        message: 'Recomendación: DESCONTINUAR INMEDIATAMENTE',
        reason: 'Sin ventas ni interés en los últimos 7 días',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
    }

    if (avg_daily_demand_7d < 0.3 && sales_30d < 3) {
      return {
        level: 'high',
        message: 'Recomendación: Descontinuar',
        reason: 'Bajo rendimiento sostenido',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      };
    }

    if (avg_daily_demand_7d < 0.5 && conversion_rate_7d < 2) {
      return {
        level: 'moderate',
        message: 'Recomendación: Considerar descontinuar',
        reason: 'Rendimiento por debajo del promedio',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      };
    }

    return null;
  };

  const recommendation = getRecommendation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Descontinuar Producto
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-slate-900 mb-2">{product.name}</h4>
              <p className="text-sm text-slate-600">{product.code}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">Stock: {product.cantidad_stock}</Badge>
              </div>
            </div>

            {/* Análisis de Desempeño */}
            {performanceData && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">📊 Análisis de Desempeño</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-slate-600">Ventas 7 días</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {performanceData.sales_7d}
                      {performanceData.sales_7d === 0 && (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-slate-600">Ventas 30 días</p>
                    <p className="text-2xl font-bold">{performanceData.sales_30d}</p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-slate-600">Conversión 7d</p>
                    <p className="text-2xl font-bold">
                      {performanceData.conversion_rate_7d.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-slate-600">Demanda diaria</p>
                    <p className="text-2xl font-bold">
                      {performanceData.avg_daily_demand_7d.toFixed(2)}
                    </p>
                  </div>
                </div>

                {recommendation && (
                  <div className={`p-4 rounded-lg ${recommendation.bgColor}`}>
                    <p className={`font-semibold ${recommendation.color}`}>
                      {recommendation.message}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">{recommendation.reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Razón de Descontinuación */}
            <div className="space-y-2">
              <Label htmlFor="discontinue-reason" className="text-slate-900">
                Razón de Descontinuación *
              </Label>
              <Textarea
                id="discontinue-reason"
                placeholder="Ejemplo: Bajo rendimiento en ventas, sin rotación en los últimos 30 días, reemplazado por modelo superior..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                Esta información será registrada para análisis futuro
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Advertencia:</strong> Este producto dejará de mostrarse en el catálogo público.
                El stock actual permanecerá en el sistema para referencia histórica.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDiscontinue}
            disabled={isSubmitting || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Descontinuando...' : 'Descontinuar Producto'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { ProductWithMetrics } from '@/hooks/useProductWithMetrics';

interface QuickPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithMetrics | null;
  suggestedQuantity?: number;
  predictionData?: {
    dias_restantes: number;
    demanda_7d: number;
    accion: string;
  };
  onSuccess?: () => void;
}

export function QuickPurchaseOrderDialog({
  open,
  onOpenChange,
  product,
  suggestedQuantity,
  predictionData,
  onSuccess,
}: QuickPurchaseOrderDialogProps) {
  const { suppliers } = useSuppliers();
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [quantity, setQuantity] = useState(suggestedQuantity || 50);
  const [unitPrice, setUnitPrice] = useState(0);
  const [expectedDeliveryDays, setExpectedDeliveryDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product && open) {
      // Pre-seleccionar primer proveedor activo si no hay preferido
      if (suppliers.length > 0) {
        setSelectedSupplierId(suppliers[0].id);
      }
      
      // Establecer precio unitario basado en el precio del producto
      setUnitPrice(product.priceSale * 0.6); // Aproximadamente 60% del precio de venta
      
      // Generar notas automáticas basadas en predicciones
      if (predictionData) {
        const autoNotes = `Orden automática generada por predicción IA.\nDías restantes de stock: ${predictionData.dias_restantes}\nDemanda estimada (7d): ${predictionData.demanda_7d}\nAcción recomendada: ${predictionData.accion}`;
        setNotes(autoNotes);
      }
    }
  }, [product, open, predictionData, suppliers]);

  useEffect(() => {
    if (suggestedQuantity) {
      setQuantity(suggestedQuantity);
    }
  }, [suggestedQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !selectedSupplierId) return;

    setIsSubmitting(true);
    try {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      if (!supplier) throw new Error('Proveedor no encontrado');

      // Generar número de orden
      const { data: orderNumber, error: orderNumberError } = await supabase.rpc(
        'generate_purchase_order_number'
      );

      if (orderNumberError) throw orderNumberError;

      const expectedDeliveryDate = new Date();
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + expectedDeliveryDays);

      const totalAmount = quantity * unitPrice;

      // Crear la orden de compra
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: selectedSupplierId,
          product_code: product.code,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          total_cost: totalAmount,
          expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
          notes: notes.trim(),
          status: 'DRAFT',
          order_type: 'automatica',
          ai_recommendation: predictionData || null,
        })
        .select()
        .single();

      if (poError) throw poError;

      // Crear el item de la orden de compra
      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .insert({
          purchase_order_id: newPO.id,
          product_code: product.code,
          product_name: product.name,
          qty_ordered: quantity,
          cost_per_unit: unitPrice,
          qty_received: 0,
        });

      if (itemError) throw itemError;

      toast.success(`Orden de compra ${orderNumber} creada exitosamente`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error('Error al crear orden de compra: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplierId('');
    setQuantity(suggestedQuantity || 50);
    setUnitPrice(0);
    setExpectedDeliveryDays(7);
    setNotes('');
  };

  if (!product) return null;

  const totalAmount = quantity * unitPrice;
  const activeSuppliers = suppliers.filter(s => s.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Crear Orden de Compra Rápida
          </DialogTitle>
          <DialogDescription className="text-left">
            Genera una orden de compra basada en predicciones de IA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info del Producto */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-slate-900 mb-2">{product.name}</h4>
            <p className="text-sm text-slate-600">{product.code}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{product.category}</Badge>
              <Badge variant="outline">Stock Actual: {product.cantidad_stock}</Badge>
            </div>
          </div>

          {/* Análisis de Predicción */}
          {predictionData && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Análisis IA</h4>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-blue-600 font-medium">Días Restantes</p>
                  <p className="text-2xl font-bold text-blue-900">{predictionData.dias_restantes}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Demanda 7d</p>
                  <p className="text-2xl font-bold text-blue-900">{predictionData.demanda_7d}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Acción</p>
                  <Badge variant="outline" className="mt-1">{predictionData.accion}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor *</Label>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {activeSuppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.lead_time_days} días entrega
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeSuppliers.length === 0 && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                No hay proveedores activos. Crea uno primero.
              </p>
            )}
          </div>

          {/* Cantidad y Precio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
              />
              {suggestedQuantity && (
                <p className="text-xs text-muted-foreground">
                  Sugerido: {suggestedQuantity} unidades
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-price">Precio Unitario (S/) *</Label>
              <Input
                id="unit-price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total de la Orden:</span>
              <span className="text-2xl font-bold text-primary">
                S/ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Días de entrega */}
          <div className="space-y-2">
            <Label htmlFor="delivery-days">Días de Entrega Estimados</Label>
            <Input
              id="delivery-days"
              type="number"
              min="1"
              value={expectedDeliveryDays}
              onChange={(e) => setExpectedDeliveryDays(parseInt(e.target.value) || 7)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Razón de la Orden</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional sobre la orden..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedSupplierId || quantity <= 0 || unitPrice <= 0}
            >
              {isSubmitting ? 'Creando...' : 'Crear Orden de Compra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

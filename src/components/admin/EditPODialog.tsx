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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit } from 'lucide-react';

interface AutoPO {
  id: string;
  order_number: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  priority: string;
  notes: string;
  created_at: string;
  supplier_name: string;
  expected_delivery_date: string;
}

interface EditPODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: AutoPO | null;
  onSuccess: () => void;
}

export const EditPODialog = ({ open, onOpenChange, po, onSuccess }: EditPODialogProps) => {
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (po) {
      setQuantity(po.quantity);
      setUnitPrice(po.unit_price);
      setNotes(po.notes);
    }
  }, [po]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po) return;

    setIsSubmitting(true);
    try {
      const totalAmount = quantity * unitPrice;

      const { error } = await supabase
        .from('purchase_orders')
        .update({
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          notes,
        })
        .eq('id', po.id);

      if (error) throw error;

      toast.success(`✅ PO ${po.order_number} actualizada exitosamente`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating PO:', error);
      toast.error('Error al actualizar la PO: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!po) return null;

  const totalAmount = quantity * unitPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Orden de Compra
          </DialogTitle>
          <DialogDescription>
            Ajusta la cantidad y precio antes de enviar al proveedor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">N° Orden:</span>
              <p className="font-mono text-lg">{po.order_number}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Producto:</span>
              <p>{po.product_name}</p>
            </div>
          </div>

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
              <p className="text-xs text-muted-foreground">
                Original: {po.quantity} unidades
              </p>
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
              <p className="text-xs text-muted-foreground">
                Original: S/ {po.unit_price.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total:</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">
                  S/ {totalAmount.toFixed(2)}
                </span>
                {totalAmount !== po.total_amount && (
                  <p className="text-xs text-muted-foreground">
                    Original: S/ {po.total_amount.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
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
            <Button type="submit" disabled={isSubmitting || quantity <= 0 || unitPrice <= 0}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Calendar,
  DollarSign,
  MapPin,
  User,
  FileText,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePurchaseOrderItems } from '@/hooks/usePurchaseOrderItems';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface PurchaseOrderDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSuccess?: () => void;
}

export function PurchaseOrderDetailDrawer({
  open,
  onOpenChange,
  order,
  onSuccess,
}: PurchaseOrderDetailDrawerProps) {
  const { items } = usePurchaseOrderItems(order?.id);
  const queryClient = useQueryClient();
  const [receiving, setReceiving] = useState(false);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>({});

  if (!order) return null;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      DRAFT: { icon: Clock, color: 'text-muted-foreground', label: 'Borrador' },
      SENT: { icon: Truck, color: 'text-blue-600', label: 'Enviada' },
      PARTIAL_RECEIPT: { icon: Package, color: 'text-orange-600', label: 'Recepción Parcial' },
      CLOSED: { icon: CheckCircle, color: 'text-green-600', label: 'Cerrada' },
      CANCELLED: { icon: XCircle, color: 'text-red-600', label: 'Cancelada' },
    };
    return configs[status] || configs.DRAFT;
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const totalOrdered = items?.reduce((sum, item) => sum + item.qty_ordered, 0) || 0;
  const totalReceived = items?.reduce((sum, item) => sum + item.qty_received, 0) || 0;
  const completionPercentage = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

  const handleReceiveItems = async () => {
    try {
      setReceiving(true);

      // Update each item with received quantity
      for (const item of items || []) {
        const qtyToReceive = receiptQuantities[item.id] || 0;
        if (qtyToReceive > 0) {
          const newQtyReceived = item.qty_received + qtyToReceive;

          // Update purchase order item
          await supabase
            .from('purchase_order_items')
            .update({ qty_received: newQtyReceived })
            .eq('id', item.id);

          // Update product stock
          await supabase.rpc('update_product_stock', {
            p_product_code: item.product_code,
            p_new_stock: qtyToReceive // This will add to existing stock
          });
        }
      }

      // Check if all items are fully received
      const allReceived = items?.every(
        item => (item.qty_received + (receiptQuantities[item.id] || 0)) >= item.qty_ordered
      );

      // Update PO status
      const newStatus = allReceived ? 'CLOSED' : 'PARTIAL_RECEIPT';
      await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          actual_delivery_date: allReceived ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', order.id);

      toast.success('Recepción registrada exitosamente');
      setReceiptQuantities({});
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items", order.id] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onSuccess?.();
    } catch (error) {
      console.error('Error receiving items:', error);
      toast.error('Error al registrar la recepción');
    } finally {
      setReceiving(false);
    }
  };

  const handleMarkAsSent = async () => {
    try {
      await supabase
        .from('purchase_orders')
        .update({ status: 'SENT' })
        .eq('id', order.id);
      
      toast.success('Orden marcada como enviada');
      onSuccess?.();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleCancel = async () => {
    try {
      await supabase
        .from('purchase_orders')
        .update({ status: 'CANCELLED' })
        .eq('id', order.id);
      
      toast.success('Orden cancelada');
      onSuccess?.();
    } catch (error) {
      toast.error('Error al cancelar la orden');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              <div>
                <div className="font-mono text-lg">{order.order_number}</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Orden de Compra
                </div>
              </div>
            </div>
            <Badge variant={order.order_type === 'automatica' ? 'default' : 'outline'}>
              {order.order_type === 'automatica' ? 'Automática' : 'Manual'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Estado y Progreso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estado y Progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado Actual</span>
                <Badge variant="outline" className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso de Recepción</span>
                  <span className="font-medium">{totalReceived} / {totalOrdered} unidades</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {completionPercentage.toFixed(0)}% completado
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="font-medium">{order.supplier?.name || 'N/A'}</div>
                {order.supplier?.contact_person && (
                  <div className="text-sm text-muted-foreground">
                    Contacto: {order.supplier.contact_person}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Lead time: {order.supplier?.lead_time_days || 0} días
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creada:</span>
                <span className="font-medium">
                  {order.created_at && format(new Date(order.created_at), 'PPP', { locale: es })}
                </span>
              </div>
              {order.expected_delivery_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega Esperada:</span>
                  <span className="font-medium">
                    {format(new Date(order.expected_delivery_date), 'PPP', { locale: es })}
                  </span>
                </div>
              )}
              {order.actual_delivery_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega Real:</span>
                  <span className="font-medium text-green-600">
                    {format(new Date(order.actual_delivery_date), 'PPP', { locale: es })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items ({items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items?.map((item) => (
                <div key={item.id} className="space-y-2 pb-4 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground">{item.product_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">S/ {item.cost_per_unit.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">por unidad</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Ordenado</div>
                      <div className="font-medium">{item.qty_ordered}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recibido</div>
                      <div className="font-medium text-green-600">{item.qty_received}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pendiente</div>
                      <div className="font-medium text-orange-600">
                        {item.qty_ordered - item.qty_received}
                      </div>
                    </div>
                  </div>

                  {order.status !== 'CLOSED' && order.status !== 'CANCELLED' && (
                    <div className="pt-2">
                      <Label className="text-xs">Cantidad a Recibir</Label>
                      <Input
                        type="number"
                        min="0"
                        max={item.qty_ordered - item.qty_received}
                        value={receiptQuantities[item.id] || 0}
                        onChange={(e) => setReceiptQuantities(prev => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value) || 0
                        }))}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notas */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="space-y-2">
            {order.status === 'DRAFT' && (
              <Button onClick={handleMarkAsSent} className="w-full">
                <Truck className="h-4 w-4 mr-2" />
                Marcar como Enviada
              </Button>
            )}

            {(order.status === 'SENT' || order.status === 'PARTIAL_RECEIPT') && (
              <Button
                onClick={handleReceiveItems}
                disabled={receiving || Object.values(receiptQuantities).every(q => q === 0)}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {receiving ? 'Procesando...' : 'Registrar Recepción'}
              </Button>
            )}

            {order.status !== 'CLOSED' && order.status !== 'CANCELLED' && (
              <Button
                onClick={handleCancel}
                variant="destructive"
                className="w-full"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Orden
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

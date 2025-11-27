import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  User, Phone, MapPin, Package, CreditCard, Truck, 
  Clock, CheckCircle2, AlertTriangle, FileText, Send, Edit, Printer 
} from "lucide-react";
import { SalesOrder } from "@/hooks/useSalesOrders";
import { OrderTimeline } from "./OrderTimeline";
import { ShippingLabelPrint } from "../ShippingLabelPrint";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OrderDetailDrawerProps {
  order: SalesOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export const OrderDetailDrawer = ({ 
  order, 
  open, 
  onClose,
  onUpdateStatus 
}: OrderDetailDrawerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>(order?.payment_status || 'PENDING');
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>(order?.fulfillment_status || 'UNFULFILLED');
  const [isSaving, setIsSaving] = useState(false);

  const { data: stateLog = [] } = useQuery({
    queryKey: ['order-state-log', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      const { data } = await supabase
        .from('order_state_log')
        .select('*')
        .eq('sales_order_id', order.id)
        .order('changed_at', { ascending: false });
      return data || [];
    },
    enabled: !!order?.id && open,
  });

  if (!order) return null;

  const handleSaveStatus = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        payment_status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
      };

      // Add timestamps based on status transitions
      if (fulfillmentStatus === 'PICKING' && !order.picking_started_at) {
        updates.picking_started_at = new Date().toISOString();
      } else if (fulfillmentStatus === 'PACKED' && !order.packed_at) {
        updates.packed_at = new Date().toISOString();
      } else if (fulfillmentStatus === 'SHIPPED' && !order.shipped_at) {
        updates.shipped_at = new Date().toISOString();
      } else if (fulfillmentStatus === 'DELIVERED' && !order.delivered_at) {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('sales_orders')
        .update(updates)
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate queries to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["order-state-log", order.id] });

      toast({
        title: "✅ Estados actualizados",
        description: "Los estados del pedido se han actualizado correctamente",
      });
      setIsEditingStatus(false);
      
      // Update local state with returned data
      if (data) {
        onUpdateStatus(order.id, data.fulfillment_status);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "❌ Error al actualizar",
        description: error.message || "No se pudo actualizar los estados. Verifica los permisos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPaymentBadge = () => {
    const variants = {
      PAID: { variant: "default" as const, label: "✅ Pagado", icon: CheckCircle2 },
      PENDING: { variant: "secondary" as const, label: "⏳ Pendiente", icon: Clock },
      REFUNDED: { variant: "outline" as const, label: "↩️ Reembolsado", icon: AlertTriangle },
      CANCELLED: { variant: "destructive" as const, label: "❌ Cancelado", icon: AlertTriangle },
    };
    const config = variants[order.payment_status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getFulfillmentBadge = () => {
    const variants = {
      UNFULFILLED: { variant: "outline" as const, label: "⏳ Sin cumplir", icon: Clock },
      PICKING: { variant: "secondary" as const, label: "🔍 Picking", icon: Package },
      PACKED: { variant: "secondary" as const, label: "📦 Empacado", icon: Package },
      SHIPPED: { variant: "default" as const, label: "🚚 Enviado", icon: Truck },
      DELIVERED: { variant: "default" as const, label: "✅ Entregado", icon: CheckCircle2 },
      PARTIAL: { variant: "secondary" as const, label: "📦 Parcial", icon: Package },
      WAITING_STOCK: { variant: "destructive" as const, label: "⚠️ Esperando Stock", icon: AlertTriangle },
      CANCELLED: { variant: "destructive" as const, label: "❌ Cancelado", icon: AlertTriangle },
    };
    const config = variants[order.fulfillment_status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canStartPicking = order.fulfillment_status === 'UNFULFILLED';
  const canPack = order.fulfillment_status === 'PICKING';
  const canShip = order.fulfillment_status === 'PACKED';
  const canDeliver = order.fulfillment_status === 'SHIPPED';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-mono text-xl sm:text-2xl">{order.order_number}</span>
            {order.priority && order.priority !== 'NORMAL' && (
              <Badge variant="destructive">{order.priority}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)]">
          <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Estado General */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4" />
                  Estado del Pedido
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingStatus(!isEditingStatus);
                    if (!isEditingStatus) {
                      setPaymentStatus(order.payment_status || 'PENDING');
                      setFulfillmentStatus(order.fulfillment_status || 'UNFULFILLED');
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {isEditingStatus ? 'Cancelar' : 'Editar Estados'}
                </Button>
              </div>

              {!isEditingStatus ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {getPaymentBadge()}
                    {getFulfillmentBadge()}
                  </div>
                  {order.customer_type === 'VIP' && (
                    <Badge className="bg-amber-500">⭐ Cliente VIP</Badge>
                  )}
                </>
              ) : (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="payment-status">Estado de Pago</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger id="payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">⏳ Pendiente</SelectItem>
                        <SelectItem value="PAID">✅ Pagado</SelectItem>
                        <SelectItem value="REFUNDED">↩️ Reembolsado</SelectItem>
                        <SelectItem value="CANCELLED">❌ Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fulfillment-status">Estado Logístico</Label>
                    <Select value={fulfillmentStatus} onValueChange={setFulfillmentStatus}>
                      <SelectTrigger id="fulfillment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNFULFILLED">⏳ Sin cumplir</SelectItem>
                        <SelectItem value="PICKING">🔍 Picking</SelectItem>
                        <SelectItem value="PACKED">📦 Empacado</SelectItem>
                        <SelectItem value="SHIPPED">🚚 Enviado</SelectItem>
                        <SelectItem value="DELIVERED">✅ Entregado</SelectItem>
                        <SelectItem value="PARTIAL">📦 Parcial</SelectItem>
                        <SelectItem value="WAITING_STOCK">⚠️ Esperando Stock</SelectItem>
                        <SelectItem value="CANCELLED">❌ Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleSaveStatus} 
                    className="w-full"
                    disabled={isSaving}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Información del Cliente
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.customer_name} {order.customer_lastname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_district}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Package className="h-4 w-4" />
                Items del Pedido ({order.items?.length || 0})
              </h3>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{item.product_name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          SKU: {item.product_code}
                          {item.product_color && ` • Color: ${item.product_color}`}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-sm sm:text-base">S/ {Number(item.unit_price).toFixed(2)}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Cant: {item.quantity}</p>
                      </div>
                    </div>
                    {item.is_backorder && (
                      <div className="space-y-2">
                        <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Cross-Docking - {item.linked_purchase_order_id ? 'PO Automática Creada' : 'Generando PO...'}
                        </Badge>
                        {item.linked_purchase_order_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={async () => {
                              const { data: po } = await supabase
                                .from('purchase_orders')
                                .select('order_number')
                                .eq('id', item.linked_purchase_order_id)
                                .single();
                              if (po) {
                                window.open(`/admin/ordenes-compra?search=${po.order_number}`, '_blank');
                              }
                            }}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Ver OC: {item.linked_purchase_order_id.slice(0, 8)}...
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 border-t font-bold gap-1">
                <span className="text-sm sm:text-base">Total:</span>
                <span className="text-base sm:text-lg">S/ {Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment & Shipping Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                Información de Pago y Envío
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                {order.payment_method && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">Método de Pago:</span>
                    <span className="font-medium">{order.payment_method}</span>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-muted-foreground">N° Tracking:</span>
                    <Badge variant="outline" className="font-mono text-xs">{order.tracking_number}</Badge>
                  </div>
                )}
                {order.courier && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground">Courier:</span>
                    <span className="font-medium">{order.courier}</span>
                  </div>
                )}
                {order.source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuente:</span>
                    <span className="font-medium capitalize">{order.source}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <OrderTimeline order={order} stateLog={stateLog} />

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas
                  </h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {order.notes}
                  </p>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm sm:text-base">Acciones Rápidas - Flujo SOP</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {canStartPicking && (
                  <Button
                    size="sm"
                    onClick={() => onUpdateStatus(order.id, 'PICKING')}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Iniciar Picking
                  </Button>
                )}
                {canPack && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onUpdateStatus(order.id, 'PACKED')}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Marcar Empacado
                  </Button>
                )}
                {canShip && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                    className="flex items-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Marcar Enviado
                  </Button>
                )}
                {canDeliver && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar Entregado
                  </Button>
                )}
                <ShippingLabelPrint 
                  order={order}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Guía de Remisión
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Factura
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={async () => {
                    try {
                      // Get customer email from phone (assuming it's stored somewhere)
                      // For now, using a placeholder - you may need to add email to sales_orders table
                      const customerEmail = order.customer_phone ? `${order.customer_phone}@placeholder.com` : '';
                      
                      await supabase.functions.invoke('notify-customer-order', {
                        body: {
                          orderNumber: order.order_number,
                          customerName: `${order.customer_name} ${order.customer_lastname || ''}`.trim(),
                          customerEmail: customerEmail,
                          items: order.items?.map(item => ({
                            productName: item.product_name,
                            quantity: item.quantity,
                            unitPrice: item.unit_price,
                            color: item.product_color,
                          })) || [],
                          total: order.total,
                          fulfillmentStatus: order.fulfillment_status || 'UNFULFILLED',
                          paymentStatus: order.payment_status || 'PENDING',
                          trackingNumber: order.tracking_number,
                          courier: order.courier,
                        }
                      });

                      toast({
                        title: "📧 Email enviado",
                        description: "El cliente ha sido notificado exitosamente",
                      });
                    } catch (error) {
                      console.error('Error sending notification:', error);
                      toast({
                        title: "Error",
                        description: "No se pudo enviar la notificación",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Send className="h-4 w-4" />
                  Notificar Cliente
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              <p>Creado: {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              {order.updated_at && (
                <p>Última actualización: {format(new Date(order.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

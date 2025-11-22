import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  User, Phone, MapPin, Package, CreditCard, Truck, 
  Clock, CheckCircle2, AlertTriangle, FileText, Send 
} from "lucide-react";
import { SalesOrder } from "@/hooks/useSalesOrders";
import { OrderTimeline } from "./OrderTimeline";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      FULFILLED: { variant: "default" as const, label: "✅ Completado", icon: CheckCircle2 },
      PARTIAL: { variant: "secondary" as const, label: "📦 Parcial", icon: Package },
      UNFULFILLED: { variant: "outline" as const, label: "⏳ Sin cumplir", icon: Clock },
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

  const canStartPicking = order.fulfillment_status === 'UNFULFILLED' && order.payment_status === 'PAID';
  const canShip = order.fulfillment_status === 'UNFULFILLED' || order.fulfillment_status === 'PARTIAL';
  const canComplete = order.fulfillment_status !== 'FULFILLED' && order.fulfillment_status !== 'CANCELLED';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="font-mono text-2xl">{order.order_number}</span>
            {order.priority && order.priority !== 'NORMAL' && (
              <Badge variant="destructive">{order.priority}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          <div className="space-y-6 mt-6">
            {/* Estado General */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Estado del Pedido
              </h3>
              <div className="flex gap-2">
                {getPaymentBadge()}
                {getFulfillmentBadge()}
              </div>
              {order.customer_type === 'VIP' && (
                <Badge className="bg-amber-500">⭐ Cliente VIP</Badge>
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
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items del Pedido ({order.items?.length || 0})
              </h3>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.product_code}
                          {item.product_color && ` • Color: ${item.product_color}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">S/ {Number(item.unit_price).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Cant: {item.quantity}</p>
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
              <div className="flex justify-between items-center pt-2 border-t font-bold">
                <span>Total:</span>
                <span className="text-lg">S/ {Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment & Shipping Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Información de Pago y Envío
              </h3>
              <div className="space-y-2 text-sm">
                {order.payment_method && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de Pago:</span>
                    <span className="font-medium">{order.payment_method}</span>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">N° Tracking:</span>
                    <Badge variant="outline" className="font-mono">{order.tracking_number}</Badge>
                  </div>
                )}
                {order.courier && (
                  <div className="flex justify-between">
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
              <h3 className="font-semibold">Acciones Rápidas</h3>
              <div className="flex flex-wrap gap-2">
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
                {canShip && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                    className="flex items-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Marcar Enviado
                  </Button>
                )}
                {canComplete && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUpdateStatus(order.id, 'FULFILLED')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Completar
                  </Button>
                )}
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSalesOrders, SalesOrder } from "@/hooks/useSalesOrders";
import { BackorderBadge } from "./BackorderBadge";

export const SalesOrderTable = () => {
  const { orders, isLoading } = useSalesOrders();

  if (isLoading) {
    return <div className="text-center py-8">Cargando pedidos...</div>;
  }

  const getPaymentBadge = (status: SalesOrder["payment_status"]) => {
    const variants = {
      PAID: { variant: "default" as const, label: "Pagado" },
      PENDING: { variant: "secondary" as const, label: "Pendiente" },
      REFUNDED: { variant: "outline" as const, label: "Reembolsado" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelado" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFulfillmentBadge = (status: SalesOrder["fulfillment_status"]) => {
    const variants = {
      FULFILLED: { variant: "default" as const, label: "Completado" },
      PARTIAL: { variant: "secondary" as const, label: "Parcial" },
      UNFULFILLED: { variant: "outline" as const, label: "Sin cumplir" },
      WAITING_STOCK: { variant: "destructive" as const, label: "⚠️ Esperando Stock" },
      CANCELLED: { variant: "destructive" as const, label: "Cancelado" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Resumen Productos</TableHead>
            <TableHead>Estado Pago</TableHead>
            <TableHead>Estado Logística</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: any) => {
            const hasBackorder = order.items?.some((item: any) => item.is_backorder);
            const itemCount = order.items?.length || 0;
            const firstItem = order.items?.[0];
            
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer_name} {order.customer_lastname}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{firstItem?.product_name}</p>
                    {itemCount > 1 && (
                      <p className="text-xs text-muted-foreground">+ {itemCount - 1} items más</p>
                    )}
                    {hasBackorder && (
                      <BackorderBadge 
                        isBackorder={true}
                        linkedPurchaseOrderId={firstItem?.linked_purchase_order_id}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                <TableCell>{getFulfillmentBadge(order.fulfillment_status)}</TableCell>
                <TableCell className="font-semibold">
                  S/ {Number(order.total).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                    {hasBackorder && (
                      <Button variant="ghost" size="sm">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

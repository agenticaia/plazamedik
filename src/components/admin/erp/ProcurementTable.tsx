import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, Clock, Truck, CheckCircle as CheckCircleIcon, XCircle, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { PartialReceiptProgress } from "./PartialReceiptProgress";
import { usePurchaseOrderItems } from "@/hooks/usePurchaseOrderItems";
import { PurchaseOrderDetailDrawer } from "./PurchaseOrderDetailDrawer";
import { POItemsSummary } from "./POItemsSummary";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { POActionsMenu } from "./POActionsMenu";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProcurementTableProps {
  searchTerm?: string;
  filterStatus?: string;
}

export const ProcurementTable = ({ searchTerm = "", filterStatus = "ALL" }: ProcurementTableProps) => {
  const { purchaseOrders, isLoading } = usePurchaseOrders();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order-items"] });
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando órdenes de compra...</div>;
  }

  // Filter orders based on search and status
  const filteredOrders = purchaseOrders.filter((po: any) => {
    const matchesSearch = 
      po.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || po.status === filterStatus;
    const isNotClosed = po.status !== "CLOSED" && po.status !== "CANCELLED";
    
    return matchesSearch && matchesStatus && isNotClosed;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: any; label: string }> = {
      DRAFT: { variant: "outline", icon: Clock, label: "📝 Borrador" },
      APPROVED: { variant: "secondary", icon: CheckCircleIcon, label: "✅ Aprobada" },
      SENT: { variant: "secondary", icon: Truck, label: "📤 Enviada" },
      CONFIRMED: { variant: "default", icon: CheckCircleIcon, label: "✔️ Confirmada" },
      IN_TRANSIT: { variant: "default", icon: Truck, label: "🚚 En Tránsito" },
      PARTIAL_RECEIVED: { variant: "secondary", icon: Package, label: "📦 Recepción Parcial" },
      RECEIVED: { variant: "default", icon: CheckCircleIcon, label: "✅ Recibida" },
      CLOSED: { variant: "default", icon: CheckCircleIcon, label: "🔒 Cerrada" },
      CANCELLED: { variant: "destructive", icon: XCircle, label: "❌ Cancelada" },
    };
    const config = variants[status] || { variant: "outline" as const, icon: Clock, label: status };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° OC / Fecha</TableHead>
            <TableHead>Proveedor / Ref. Vendor</TableHead>
            <TableHead>Items (Resumen)</TableHead>
            <TableHead>Estado Logístico</TableHead>
            <TableHead>Estado de Pago</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No se encontraron órdenes de compra
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map((po: any) => {
            const isAutomatic = po.order_type === "automatica" || po.po_type === "CROSS_DOCKING";
            
            return (
              <TableRow key={po.id} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <p className="font-mono text-sm font-semibold">{po.order_number}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {po.created_at && format(new Date(po.created_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{po.supplier?.name || "N/A"}</p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Lead time: {po.supplier?.lead_time_days || 0} días</p>
                      {po.vendor_reference_number && (
                        <p className="font-mono">Ref: {po.vendor_reference_number}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <POItemsSummary poId={po.id} />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {getStatusBadge(po.status)}
                    {isAutomatic && (
                      <Badge variant="outline" className="block w-fit text-xs">
                        IA Automática
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge 
                    status={po.payment_status || "PENDING"}
                    advanceAmount={po.advance_payment_amount}
                    totalCost={po.total_cost}
                  />
                </TableCell>
                <TableCell>
                  <PurchaseOrderItemProgress poId={po.id} />
                </TableCell>
                <TableCell>
                  <span className="text-sm">{po.warehouse_destination || "Almacén Principal"}</span>
                </TableCell>
                <TableCell className="text-right">
                  <POActionsMenu 
                    order={po}
                    onViewDetails={() => handleViewDetails(po)}
                  />
                </TableCell>
              </TableRow>
            );
          }))}
        </TableBody>
      </Table>

      <PurchaseOrderDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        order={selectedOrder}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

const PurchaseOrderItemProgress = ({ poId }: { poId: string }) => {
  const { items } = usePurchaseOrderItems(poId);
  
  if (!items || items.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
  
  const totalOrdered = items.reduce((sum, item) => sum + item.qty_ordered, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.qty_received, 0);
  
  return <PartialReceiptProgress qtyOrdered={totalOrdered} qtyReceived={totalReceived} />;
};

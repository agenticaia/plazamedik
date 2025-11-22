import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, Clock, Truck, CheckCircle as CheckCircleIcon, XCircle } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";

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
      DRAFT: { variant: "outline", icon: Clock, label: "Borrador" },
      SENT: { variant: "secondary", icon: Truck, label: "Enviada" },
      PARTIAL_RECEIPT: { variant: "default", icon: Package, label: "Recepción Parcial" },
      CLOSED: { variant: "default", icon: CheckCircleIcon, label: "Cerrada" },
      CANCELLED: { variant: "destructive", icon: XCircle, label: "Cancelada" },
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
            <TableHead>N° OC</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Progreso Recepción</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No se encontraron órdenes de compra
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map((po: any) => {
            const isAutomatic = po.order_type === "automatica" || po.po_type === "CROSS_DOCKING";
            
            return (
              <TableRow key={po.id}>
                <TableCell className="font-mono text-sm">{po.order_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{po.supplier?.name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">
                      Lead time: {po.supplier?.lead_time_days || 0} días
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={isAutomatic ? "default" : "outline"}>
                    {isAutomatic ? "Automática" : "Manual"}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(po.status)}</TableCell>
                <TableCell>
                  <PurchaseOrderItemProgress poId={po.id} />
                </TableCell>
                <TableCell>Almacén Principal</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(po)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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

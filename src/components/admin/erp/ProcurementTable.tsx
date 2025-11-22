import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle } from "lucide-react";
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

export const ProcurementTable = () => {
  const { purchaseOrders, isLoading } = usePurchaseOrders();

  if (isLoading) {
    return <div className="text-center py-8">Cargando órdenes de compra...</div>;
  }

  const activeOrders = purchaseOrders.filter(
    (po: any) => po.status !== "CLOSED" && po.status !== "CANCELLED"
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      DRAFT: { variant: "outline", label: "Borrador" },
      SENT: { variant: "secondary", label: "Enviada" },
      PARTIAL_RECEIPT: { variant: "default", label: "Recepción Parcial" },
      CLOSED: { variant: "default", label: "Cerrada" },
      CANCELLED: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          {activeOrders.map((po: any) => {
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
                    <Button variant="ghost" size="sm">
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
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

const PurchaseOrderItemProgress = ({ poId }: { poId: string }) => {
  const { items } = usePurchaseOrderItems(poId);
  
  if (!items || items.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
  
  const totalOrdered = items.reduce((sum, item) => sum + item.qty_ordered, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.qty_received, 0);
  
  return <PartialReceiptProgress qtyOrdered={totalOrdered} qtyReceived={totalReceived} />;
};

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Copy,
  FileText,
  Printer,
  XCircle,
  MoreVertical,
  Edit,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface POActionsMenuProps {
  order: any;
  onViewDetails: () => void;
  onEdit?: () => void;
}

export function POActionsMenu({ order, onViewDetails, onEdit }: POActionsMenuProps) {
  const queryClient = useQueryClient();

  const handleDuplicate = async () => {
    try {
      const { data, error } = await supabase.rpc("duplicate_purchase_order", {
        source_po_id: order.id,
        new_notes: `Duplicada de ${order.order_number} el ${new Date().toLocaleDateString()}`
      });

      if (error) throw error;

      toast.success("Orden duplicada exitosamente", {
        description: "La nueva orden fue creada como borrador"
      });
      
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    } catch (error: any) {
      console.error("Error duplicating order:", error);
      toast.error("Error al duplicar la orden", {
        description: error.message
      });
    }
  };

  const handleGeneratePDF = () => {
    // This will be implemented with a proper PDF library
    toast.info("Generación de PDF", {
      description: "Esta funcionalidad estará disponible próximamente"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de cancelar esta orden?")) return;

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "CANCELLED" })
        .eq("id", order.id);

      if (error) throw error;

      toast.success("Orden cancelada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    } catch (error: any) {
      toast.error("Error al cancelar la orden", {
        description: error.message
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </DropdownMenuItem>

        {onEdit && order.status === "DRAFT" && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Orden
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicar Orden
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleGeneratePDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </DropdownMenuItem>

        {order.status !== "CANCELLED" && order.status !== "CLOSED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCancel} className="text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Orden
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

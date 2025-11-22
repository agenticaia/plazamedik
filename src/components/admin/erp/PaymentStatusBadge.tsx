import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentStatusBadgeProps {
  status: "PENDING" | "PARTIAL_PAID" | "PAID" | "OVERDUE";
  advanceAmount?: number;
  totalCost?: number;
}

export function PaymentStatusBadge({ status, advanceAmount = 0, totalCost = 0 }: PaymentStatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      variant: "outline" as const,
      icon: Clock,
      label: "Pendiente de Pago",
      color: "text-muted-foreground",
      tooltip: "El pago no ha sido realizado"
    },
    PARTIAL_PAID: {
      variant: "secondary" as const,
      icon: DollarSign,
      label: "Pago Parcial",
      color: "text-blue-600",
      tooltip: `Anticipo: S/ ${advanceAmount.toFixed(2)} / S/ ${totalCost.toFixed(2)}`
    },
    PAID: {
      variant: "default" as const,
      icon: CheckCircle,
      label: "Pagado",
      color: "text-green-600",
      tooltip: "Pago completado"
    },
    OVERDUE: {
      variant: "destructive" as const,
      icon: AlertTriangle,
      label: "Vencido",
      color: "text-destructive",
      tooltip: "El pago está vencido"
    }
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="gap-1 cursor-help">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

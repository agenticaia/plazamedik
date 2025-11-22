import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, CheckCircle2, Package, Truck, AlertCircle, Settings } from "lucide-react";
import { SalesOrder } from "@/hooks/useSalesOrders";

interface OrderTimelineProps {
  order: SalesOrder;
  stateLog: any[];
}

export const OrderTimeline = ({ order, stateLog }: OrderTimelineProps) => {
  const timelineEvents = [
    {
      label: "Pedido Creado",
      timestamp: order.created_at,
      icon: Clock,
      completed: true,
      variant: "default"
    },
    order.picking_started_at && {
      label: "Picking Iniciado",
      timestamp: order.picking_started_at,
      icon: Package,
      completed: true,
      variant: "default"
    },
    order.packed_at && {
      label: "Empacado",
      timestamp: order.packed_at,
      icon: Package,
      completed: true,
      variant: "default"
    },
    order.shipped_at && {
      label: "Enviado",
      timestamp: order.shipped_at,
      icon: Truck,
      completed: true,
      variant: "default"
    },
    order.delivered_at && {
      label: "Entregado",
      timestamp: order.delivered_at,
      icon: CheckCircle2,
      completed: true,
      variant: "success"
    },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Timeline del Pedido
      </h3>
      
      <div className="space-y-4">
        {/* Main workflow timeline */}
        <div className="relative">
          {timelineEvents.map((event: any, idx) => {
            const Icon = event.icon;
            const isLast = idx === timelineEvents.length - 1;
            
            return (
              <div key={idx} className="flex gap-3 relative">
                {!isLast && (
                  <div className="absolute left-[11px] top-8 w-0.5 h-full bg-border" />
                )}
                <div className={`
                  flex h-6 w-6 items-center justify-center rounded-full border-2 
                  ${event.completed ? 'bg-primary border-primary' : 'bg-background border-border'}
                  relative z-10
                `}>
                  <Icon className={`h-3 w-3 ${event.completed ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 pb-8">
                  <p className={`text-sm font-medium ${event.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {event.label}
                  </p>
                  {event.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* State change log */}
        {stateLog.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <Settings className="h-3 w-3" />
              Historial de Cambios
            </p>
            {stateLog.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 text-xs">
                {log.automated ? (
                  <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p>
                    {log.from_state && <span className="text-muted-foreground">{log.from_state} → </span>}
                    <span className="font-medium">{log.to_state}</span>
                  </p>
                  {log.notes && (
                    <p className="text-muted-foreground italic">{log.notes}</p>
                  )}
                  <p className="text-muted-foreground">
                    {format(new Date(log.changed_at), "dd/MM HH:mm", { locale: es })}
                    {log.automated && " • Automático"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

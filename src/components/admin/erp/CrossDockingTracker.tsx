import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, Truck, CheckCircle2, Clock, AlertTriangle, 
  ArrowRight, ExternalLink 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CrossDockingItem {
  sales_order_id: string;
  sales_order_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  purchase_order_id: string;
  purchase_order_number: string;
  po_status: string;
  supplier_name: string;
  created_at: string;
}

export const CrossDockingTracker = () => {
  const { data: crossDockingItems = [], isLoading } = useQuery({
    queryKey: ['cross-docking-items'],
    queryFn: async () => {
      // Get sales order items that are backorders with linked POs
      const { data: items } = await supabase
        .from('sales_order_items')
        .select(`
          id,
          product_name,
          quantity,
          sales_order_id,
          linked_purchase_order_id,
          sales_orders!inner(
            order_number,
            customer_name,
            created_at
          ),
          purchase_orders!inner(
            order_number,
            status,
            suppliers(name)
          )
        `)
        .eq('is_backorder', true)
        .not('linked_purchase_order_id', 'is', null);

      return (items || []).map((item: any) => ({
        sales_order_id: item.sales_order_id,
        sales_order_number: item.sales_orders.order_number,
        customer_name: item.sales_orders.customer_name,
        product_name: item.product_name,
        quantity: item.quantity,
        purchase_order_id: item.linked_purchase_order_id,
        purchase_order_number: item.purchase_orders.order_number,
        po_status: item.purchase_orders.status,
        supplier_name: item.purchase_orders.suppliers?.name || 'N/A',
        created_at: item.sales_orders.created_at,
      })) as CrossDockingItem[];
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      DRAFT: { variant: "secondary", label: "Borrador", icon: Clock },
      SENT: { variant: "default", label: "Enviada", icon: Truck },
      RECEIVED: { variant: "default", label: "Recibida", icon: CheckCircle2 },
      PARTIAL_RECEIPT: { variant: "secondary", label: "Recepción Parcial", icon: Package },
      CLOSED: { variant: "outline", label: "Cerrada", icon: CheckCircle2 },
    };
    
    const config = variants[status] || { variant: "outline", label: status, icon: AlertTriangle };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getFlowStep = (status: string) => {
    const steps = ['DRAFT', 'SENT', 'RECEIVED', 'CLOSED'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? currentIndex + 1 : 0;
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando seguimiento cross-docking...</div>;
  }

  if (crossDockingItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cross-Docking Activo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay pedidos en proceso de cross-docking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Cross-Docking Activo ({crossDockingItems.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pedidos que van directo del proveedor al cliente sin almacenamiento
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {crossDockingItems.map((item) => (
            <div key={item.sales_order_id + item.purchase_order_id} className="border rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      Venta: {item.sales_order_number}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono text-xs">
                      Compra: {item.purchase_order_number}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cliente: <span className="font-medium text-foreground">{item.customer_name}</span>
                  </p>
                </div>
                {getStatusBadge(item.po_status)}
              </div>

              {/* Product Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {item.quantity} • Proveedor: {item.supplier_name}
                  </p>
                </div>
              </div>

              {/* Flow Visualization */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`flex items-center gap-1 ${getFlowStep(item.po_status) >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-2 w-2 rounded-full ${getFlowStep(item.po_status) >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>Solicitado</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${getFlowStep(item.po_status) >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-2 w-2 rounded-full ${getFlowStep(item.po_status) >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>Enviado</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${getFlowStep(item.po_status) >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-2 w-2 rounded-full ${getFlowStep(item.po_status) >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>Recibido</span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className={`flex items-center gap-1 ${getFlowStep(item.po_status) >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`h-2 w-2 rounded-full ${getFlowStep(item.po_status) >= 4 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>Despachado</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => window.location.href = `/admin/pedidos?order=${item.sales_order_id}`}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver Venta
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => window.location.href = `/admin/ordenes-compra?order=${item.purchase_order_id}`}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver Compra
                </Button>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground">
                Creado: {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

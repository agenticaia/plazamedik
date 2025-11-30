import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_lastname: string | null;
  customer_phone: string | null;
  customer_district: string | null;
  payment_status: "PAID" | "PENDING" | "REFUNDED" | "CANCELLED";
  fulfillment_status: "UNFULFILLED" | "PICKING" | "PACKED" | "SHIPPED" | "DELIVERED" | "PARTIAL" | "WAITING_STOCK" | "CANCELLED";
  total: number;
  source: string;
  recommended_by: string | null;
  created_at: string;
  updated_at: string;
  items?: SalesOrderItem[];
  picking_started_at?: string | null;
  packed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  tracking_number?: string | null;
  courier?: string | null;
  priority?: string | null;
  customer_type?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_code: string;
  product_name: string;
  product_color: string | null;
  quantity: number;
  unit_price: number;
  is_backorder: boolean;
  linked_purchase_order_id: string | null;
  created_at: string;
}

export const useSalesOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      // Fetch from sales_orders
      const { data: salesOrders, error: salesError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          items:sales_order_items(*)
        `)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Fetch from pedidos table
      const { data: pedidos, error: pedidosError } = await supabase
        .from("pedidos")
        .select("*")
        .order("timestamp_registro", { ascending: false });

      if (pedidosError) {
        console.warn("Error fetching pedidos:", pedidosError);
        return salesOrders || [];
      }

      // Map pedidos to SalesOrder format
      const mappedPedidos = (pedidos || []).map((p: any) => ({
        id: p.id,
        order_number: p.codigo,
        customer_name: p.cliente_nombre,
        customer_lastname: p.cliente_apellido,
        customer_phone: p.cliente_telefono,
        customer_district: p.distrito,
        payment_status: p.confirmacion_pago ? "PAID" : "PENDING",
        fulfillment_status: mapPedidoEstadoToFulfillment(p.estado),
        total: p.precio_total,
        source: p.ruta === "whatsapp_manual" ? "whatsapp" : "web",
        recommended_by: null,
        created_at: p.timestamp_registro || p.created_at,
        updated_at: p.updated_at,
        items: (p.productos || []).map((prod: any, idx: number) => ({
          id: `${p.id}-${idx}`,
          sales_order_id: p.id,
          product_code: prod.id || prod.codigo || "",
          product_name: prod.nombre || "",
          product_color: prod.color || null,
          quantity: prod.cantidad || 1,
          unit_price: prod.precio || 0,
          is_backorder: false,
          linked_purchase_order_id: null,
          created_at: p.created_at,
        })),
        picking_started_at: null,
        packed_at: null,
        shipped_at: null,
        delivered_at: p.timestamp_entregado,
        tracking_number: p.codigo_seguimiento,
        courier: null,
        priority: "NORMAL",
        customer_type: "REGULAR",
        payment_method: p.metodo_pago,
        notes: p.notas_internas,
        // Mark as from pedidos table for identification
        _source_table: "pedidos",
      }));

      // Combine and sort by date
      const combined = [...(salesOrders || []), ...mappedPedidos];
      combined.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return combined;
    },
  });

// Helper function to map pedido estado to fulfillment status
function mapPedidoEstadoToFulfillment(estado: string): SalesOrder["fulfillment_status"] {
  const mapping: Record<string, SalesOrder["fulfillment_status"]> = {
    borrador: "UNFULFILLED",
    pendiente_confirmacion: "UNFULFILLED",
    confirmado: "PICKING",
    en_ruta: "SHIPPED",
    entregado: "DELIVERED",
    cancelado: "CANCELLED",
  };
  return mapping[estado] || "UNFULFILLED";
}

  const updateStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      status,
      payment_status, 
      fulfillment_status 
    }: { 
      orderId: string; 
      status?: string;
      payment_status?: SalesOrder["payment_status"];
      fulfillment_status?: SalesOrder["fulfillment_status"];
    }) => {
      const updates: any = {};
      
      // Handle SOP status transitions with timestamps
      if (status === 'PICKING') {
        updates.fulfillment_status = 'PICKING';
        updates.picking_started_at = new Date().toISOString();
      } else if (status === 'PACKED') {
        updates.fulfillment_status = 'PACKED';
        updates.packed_at = new Date().toISOString();
      } else if (status === 'SHIPPED') {
        updates.fulfillment_status = 'SHIPPED';
        updates.shipped_at = new Date().toISOString();
      } else if (status === 'DELIVERED') {
        updates.fulfillment_status = 'DELIVERED';
        updates.delivered_at = new Date().toISOString();
      }
      
      // Direct status updates
      if (payment_status) updates.payment_status = payment_status;
      if (fulfillment_status) updates.fulfillment_status = fulfillment_status;

      const { data, error } = await supabase
        .from("sales_orders")
        .update(updates)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-state-log"] });
      toast.success("Estado actualizado exitosamente");
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast.error("Error al actualizar: " + error.message);
    },
  });

  const markAsBackorder = useMutation({
    mutationFn: async ({ itemId, linkedPOId }: { itemId: string; linkedPOId: string }) => {
      const { data, error } = await supabase
        .from("sales_order_items")
        .update({ 
          is_backorder: true, 
          linked_purchase_order_id: linkedPOId 
        })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Item marcado como backorder");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  return {
    orders,
    isLoading,
    updateStatus,
    markAsBackorder,
  };
};

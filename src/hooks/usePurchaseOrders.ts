import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: "DRAFT" | "SENT" | "PARTIAL_RECEIPT" | "CLOSED" | "CANCELLED";
  order_type: "manual" | "automatica";
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  ai_recommendation: any;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(name, lead_time_days)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPurchaseOrder = useMutation({
    mutationFn: async (order: {
      supplier_id: string;
      product_code: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      order_type: "manual" | "automatica";
      expected_delivery_date?: string;
      ai_recommendation?: any;
      notes?: string;
    }) => {
      const { data: orderNumber } = await supabase.rpc("generate_po_number_sequential");
      
      const total_amount = order.quantity * order.unit_price;
      
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("purchase_orders")
        .insert({
          ...order,
          order_number: orderNumber,
          total_amount,
          created_by: user.user?.id,
          status: "DRAFT",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Orden de compra creada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al crear orden: " + error.message);
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PurchaseOrder["status"] }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const updates: any = { status };
      
      if (status === "SENT") {
        updates.approved_by = user.user?.id;
      }

      const { data, error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Estado actualizado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar estado: " + error.message);
    },
  });

  const markAsReceived = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("process_purchase_order_received", {
        p_order_id: orderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Orden recibida y stock actualizado");
    },
    onError: (error) => {
      toast.error("Error al procesar recepción: " + error.message);
    },
  });

  return {
    purchaseOrders,
    isLoading,
    createPurchaseOrder,
    updateOrderStatus,
    markAsReceived,
  };
};
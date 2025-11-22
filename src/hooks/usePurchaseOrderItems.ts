import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_code: string;
  product_name: string;
  qty_ordered: number;
  qty_received: number;
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
}

export const usePurchaseOrderItems = (purchaseOrderId?: string) => {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["purchase-order-items", purchaseOrderId],
    queryFn: async () => {
      let query = supabase
        .from("purchase_order_items")
        .select("*");

      if (purchaseOrderId) {
        query = query.eq("purchase_order_id", purchaseOrderId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as PurchaseOrderItem[];
    },
    enabled: !!purchaseOrderId,
  });

  const receivePartial = useMutation({
    mutationFn: async ({ itemId, qtyReceived }: { itemId: string; qtyReceived: number }) => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .update({ qty_received: qtyReceived })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock del producto
      const item = data as PurchaseOrderItem;
      
      // Obtener stock actual
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("cantidad_stock")
        .eq("product_code", item.product_code)
        .single();

      if (fetchError) throw fetchError;
      
      const { error: stockError } = await supabase
        .from("products")
        .update({ 
          cantidad_stock: (product?.cantidad_stock || 0) + qtyReceived
        })
        .eq("product_code", item.product_code);

      if (stockError) throw stockError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Recepción parcial registrada y stock actualizado");
    },
    onError: (error) => {
      toast.error("Error al recibir: " + error.message);
    },
  });

  const receiveComplete = useMutation({
    mutationFn: async (itemId: string) => {
      // Obtener el item
      const { data: item, error: fetchError } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;

      const remaining = item.qty_ordered - item.qty_received;

      const { data, error } = await supabase
        .from("purchase_order_items")
        .update({ qty_received: item.qty_ordered })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock del producto con la cantidad restante
      const { data: product, error: fetchError2 } = await supabase
        .from("products")
        .select("cantidad_stock")
        .eq("product_code", item.product_code)
        .single();

      if (fetchError2) throw fetchError2;

      const { error: stockError } = await supabase
        .from("products")
        .update({ 
          cantidad_stock: (product?.cantidad_stock || 0) + remaining
        })
        .eq("product_code", item.product_code);

      if (stockError) throw stockError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order-items"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Recepción completa y stock actualizado");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  return {
    items,
    isLoading,
    receivePartial,
    receiveComplete,
  };
};

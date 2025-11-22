import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Vendor {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  lead_time_days: number;
  performance_rating: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useVendors = () => {
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Vendor[];
    },
  });

  const createVendor = useMutation({
    mutationFn: async (vendor: Omit<Vendor, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("vendors")
        .insert(vendor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Proveedor creado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al crear proveedor: " + error.message);
    },
  });

  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vendor> & { id: string }) => {
      const { data, error } = await supabase
        .from("vendors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Proveedor actualizado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar proveedor: " + error.message);
    },
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Proveedor eliminado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar proveedor: " + error.message);
    },
  });

  return {
    vendors,
    isLoading,
    createVendor,
    updateVendor,
    deleteVendor,
  };
};

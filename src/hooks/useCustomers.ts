import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  phone: string;
  name: string;
  lastname: string | null;
  email: string | null;
  district: string | null;
  address: string | null;
  customer_type: string;
  referral_code: string;
  referred_by_code: string | null;
  total_orders: number;
  total_spent: number;
  referral_credits: number;
  ai_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_customer_id: string;
  referred_customer_id: string;
  referral_code_used: string;
  order_id: string | null;
  credit_amount: number;
  status: string;
  created_at: string;
  referred_customer?: Customer;
}

export const useCustomers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Customer[];
    },
  });

  const updateCustomerNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("customers")
        .update({ ai_notes: notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Notas actualizadas",
        description: "Las observaciones del cliente han sido guardadas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las notas.",
        variant: "destructive",
      });
      console.error("Error updating notes:", error);
    },
  });

  return {
    customers,
    isLoading,
    updateCustomerNotes,
  };
};

export const useCustomerReferrals = (customerId: string) => {
  return useQuery({
    queryKey: ["referrals", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          referred_customer:customers!referrals_referred_customer_id_fkey(*)
        `)
        .eq("referrer_customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!customerId,
  });
};

export const useCustomerOrders = (customerId: string) => {
  return useQuery({
    queryKey: ["customer-orders", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(`
          *,
          sales_order_items(*)
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
};

export const useValidateReferralCode = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, lastname, referral_code")
        .eq("referral_code", code)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CurrentCustomer {
  id: string;
  name: string;
  lastname: string | null;
  phone: string;
  email: string | null;
  district: string | null;
  address: string | null;
  referral_code: string;
  referral_credits: number;
  total_orders: number;
  total_spent: number;
  created_at: string | null;
}

export const useCurrentCustomer = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-customer", user?.email, user?.phone],
    queryFn: async () => {
      const email = user?.email;
      const phone = user?.phone;

      if (!email && !phone) return null;

      // Buscar por email O teléfono (no exclusivo) para vincular pedidos WhatsApp
      let query = supabase
        .from("customers")
        .select("id, name, lastname, phone, email, district, address, referral_code, referral_credits, total_orders, total_spent, created_at");

      if (email && phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        query = query.eq("email", email);
      } else if (phone) {
        query = query.eq("phone", phone);
      }

      const { data, error } = await query
        .order("total_orders", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CurrentCustomer | null;
    },
    enabled: !!(user?.email || user?.phone),
  });
};

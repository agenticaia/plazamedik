import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CurrentCustomer {
  id: string;
  name: string;
  lastname: string | null;
  phone: string;
  email: string | null;
  referral_code: string;
  referral_credits: number;
}

export const useCurrentCustomer = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-customer", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, lastname, phone, email, referral_code, referral_credits")
        .eq("email", user.email)
        .maybeSingle();

      if (error) throw error;
      return data as CurrentCustomer | null;
    },
    enabled: !!user?.email,
  });
};

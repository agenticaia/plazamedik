import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Crea un customer mínimo asociado al usuario logueado si aún no existe.
 * Útil para que el usuario pueda obtener su código de referido sin haber
 * completado un pedido todavía.
 */
export const useEnsureCustomer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Usuario sin email");

      // 1) Verificar si ya existe por email
      const { data: existingByEmail } = await supabase
        .from("customers")
        .select("id, referral_code")
        .eq("email", user.email)
        .maybeSingle();

      if (existingByEmail) return existingByEmail;

      // 2) Verificar por phone (si el usuario tiene phone)
      if (user.phone) {
        const { data: existingByPhone } = await supabase
          .from("customers")
          .select("id, referral_code, email")
          .eq("phone", user.phone)
          .maybeSingle();

        if (existingByPhone) {
          // Vincular email si faltaba
          if (!existingByPhone.email) {
            await supabase
              .from("customers")
              .update({ email: user.email })
              .eq("id", existingByPhone.id);
          }
          return existingByPhone;
        }
      }

      // 3) Generar código de referido vía RPC
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_referral_code"
      );
      if (codeError) throw codeError;
      const referralCode = codeData as unknown as string;

      // 4) Crear customer mínimo (phone placeholder único si no hay phone real)
      const fullName = (user.user_metadata?.full_name as string) || user.email.split("@")[0];
      const [firstName, ...rest] = fullName.split(" ");
      const lastname = rest.join(" ") || null;
      const phonePlaceholder = user.phone || `pending-${user.id.slice(0, 8)}`;

      const { data: created, error: insertError } = await supabase
        .from("customers")
        .insert({
          name: firstName || "Cliente",
          lastname,
          email: user.email,
          phone: phonePlaceholder,
          referral_code: referralCode,
          customer_type: "REGULAR",
        })
        .select("id, referral_code")
        .single();

      if (insertError) throw insertError;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-customer"] });
    },
  });
};

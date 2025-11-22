import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentSummary {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  payment_status: string;
  total_cost: number;
  advance_payment_amount: number;
  balance_due: number;
  payment_terms: string | null;
  created_at: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  days_overdue: number;
}

export const usePaymentDashboard = () => {
  const { data: paymentSummary, isLoading } = useQuery({
    queryKey: ["payment-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_purchase_orders_payment_summary")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentSummary[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate metrics
  const metrics = paymentSummary
    ? {
        totalOutstanding: paymentSummary.reduce((sum, po) => sum + po.balance_due, 0),
        totalPaid: paymentSummary
          .filter((po) => po.payment_status === "PAID")
          .reduce((sum, po) => sum + po.total_cost, 0),
        totalOverdue: paymentSummary
          .filter((po) => po.payment_status === "OVERDUE")
          .reduce((sum, po) => sum + po.balance_due, 0),
        overdueCount: paymentSummary.filter((po) => po.payment_status === "OVERDUE").length,
        pendingCount: paymentSummary.filter((po) => po.payment_status === "PENDING").length,
        partialPaidCount: paymentSummary.filter((po) => po.payment_status === "PARTIAL_PAID").length,
        avgDaysOverdue:
          paymentSummary.filter((po) => po.days_overdue > 0).length > 0
            ? paymentSummary
                .filter((po) => po.days_overdue > 0)
                .reduce((sum, po) => sum + po.days_overdue, 0) /
              paymentSummary.filter((po) => po.days_overdue > 0).length
            : 0,
      }
    : {
        totalOutstanding: 0,
        totalPaid: 0,
        totalOverdue: 0,
        overdueCount: 0,
        pendingCount: 0,
        partialPaidCount: 0,
        avgDaysOverdue: 0,
      };

  // Group by supplier for analytics
  const bySupplier = paymentSummary
    ? Object.values(
        paymentSummary.reduce((acc, po) => {
          if (!acc[po.supplier_id]) {
            acc[po.supplier_id] = {
              supplier_name: po.supplier_name,
              total_outstanding: 0,
              total_overdue: 0,
              order_count: 0,
            };
          }
          acc[po.supplier_id].total_outstanding += po.balance_due;
          if (po.payment_status === "OVERDUE") {
            acc[po.supplier_id].total_overdue += po.balance_due;
          }
          acc[po.supplier_id].order_count += 1;
          return acc;
        }, {} as Record<string, any>)
      )
    : [];

  return {
    paymentSummary,
    metrics,
    bySupplier,
    isLoading,
  };
};

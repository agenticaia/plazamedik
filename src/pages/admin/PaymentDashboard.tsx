import { AdminLayout } from "@/components/admin/AdminLayout";
import { usePaymentDashboard } from "@/hooks/usePaymentDashboard";
import { PaymentKPICards } from "@/components/admin/payments/PaymentKPICards";
import { CashFlowProjectionChart } from "@/components/admin/payments/CashFlowProjectionChart";
import { OverdueInvoicesTable } from "@/components/admin/payments/OverdueInvoicesTable";
import { SupplierBalanceChart } from "@/components/admin/payments/SupplierBalanceChart";
import { CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PaymentDashboard() {
  const { paymentSummary, metrics, bySupplier, isLoading } = usePaymentDashboard();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["payment-summary"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    toast.success("Datos actualizados");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Dashboard de Pagos
              </h1>
            </div>
            <p className="text-muted-foreground">
              Control financiero de purchase orders: balances, vencimientos y proyecciones
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <section>
          <PaymentKPICards metrics={metrics} isLoading={isLoading} />
        </section>

        {/* Cash Flow & Supplier Balance */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashFlowProjectionChart paymentSummary={paymentSummary} isLoading={isLoading} />
            <SupplierBalanceChart bySupplier={bySupplier} isLoading={isLoading} />
          </div>
        </section>

        {/* Overdue Invoices Table */}
        <section>
          <OverdueInvoicesTable paymentSummary={paymentSummary} isLoading={isLoading} />
        </section>

        {/* Quick Actions / Tips */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h3 className="font-semibold text-sm">Pagos al Día</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Mantén una buena relación con proveedores pagando dentro de los términos acordados
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <h3 className="font-semibold text-sm">Negociación de Términos</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Considera negociar mejores términos de pago con proveedores frecuentes
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <h3 className="font-semibold text-sm">Alerta de Vencimientos</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Revisa diariamente las facturas vencidas para evitar penalizaciones
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

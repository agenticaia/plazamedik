import { AdminLayout } from "@/components/admin/AdminLayout";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import { KPIBanner } from "@/components/admin/executive/KPIBanner";
import { InventoryRiskChart } from "@/components/admin/executive/InventoryRiskChart";
import { RevenueConversionScatter } from "@/components/admin/executive/RevenueConversionScatter";
import { CriticalRestockTable } from "@/components/admin/executive/CriticalRestockTable";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ExecutiveDashboard() {
  const { metrics, lowStockProducts, products, inventoryValue, isLoading } = useExecutiveDashboard();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["low-stock-products"] });
    queryClient.invalidateQueries({ queryKey: ["products-executive"] });
    toast.success("Dashboard data refreshed");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Executive Analytics Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Real-time business intelligence and inventory analytics
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* SECTION 1: Top KPI Banner */}
        <section>
          <KPIBanner metrics={metrics} inventoryValue={inventoryValue} isLoading={isLoading} />
        </section>

        {/* SECTION 2: Mid-Section Charts */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Tactical Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryRiskChart products={products} isLoading={isLoading} />
            <RevenueConversionScatter products={products} isLoading={isLoading} />
          </div>
        </section>

        {/* SECTION 3: Bottom Section - Critical Restock */}
        <section>
          <CriticalRestockTable products={lowStockProducts} isLoading={isLoading} />
        </section>
      </div>
    </AdminLayout>
  );
}

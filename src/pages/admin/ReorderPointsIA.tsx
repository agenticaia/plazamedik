import { AdminLayout } from "@/components/admin/AdminLayout";
import { ReorderPointCalculator } from "@/components/admin/ReorderPointCalculator";
import { ROPSimulator } from "@/components/admin/ROPSimulator";
import { ProductSalesHistoryChart } from "@/components/admin/ProductSalesHistoryChart";

export default function ReorderPointsIA() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <ReorderPointCalculator />
        <ROPSimulator />
        <ProductSalesHistoryChart />
      </div>
    </AdminLayout>
  );
}

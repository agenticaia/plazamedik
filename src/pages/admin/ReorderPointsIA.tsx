import { AdminLayout } from "@/components/admin/AdminLayout";
import { ReorderPointCalculator } from "@/components/admin/ReorderPointCalculator";

export default function ReorderPointsIA() {
  return (
    <AdminLayout>
      <div className="p-6">
        <ReorderPointCalculator />
      </div>
    </AdminLayout>
  );
}

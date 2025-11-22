import { AdminLayout } from "@/components/admin/AdminLayout";
import { ReorderPointCalculator } from "@/components/admin/ReorderPointCalculator";
import { ROPCalculationExample } from "@/components/admin/ROPCalculationExample";

export default function ReorderPointsIA() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Puntos de Reorden Inteligentes (IA)</h1>
          <p className="text-muted-foreground">
            Sistema automático de reabastecimiento basado en análisis de demanda y lead time
          </p>
        </div>
        
        {/* Ejemplo educativo del cálculo */}
        <ROPCalculationExample />
        
        {/* Calculadora y gestión de ROP */}
        <ReorderPointCalculator />
      </div>
    </AdminLayout>
  );
}

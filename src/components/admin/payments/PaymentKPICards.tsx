import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentKPICardsProps {
  metrics: {
    totalOutstanding: number;
    totalPaid: number;
    totalOverdue: number;
    overdueCount: number;
    pendingCount: number;
    partialPaidCount: number;
    avgDaysOverdue: number;
  };
  isLoading: boolean;
}

export const PaymentKPICards = ({ metrics, isLoading }: PaymentKPICardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Outstanding */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-amber-600" />
            Balance Pendiente Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-600">
            S/ {metrics.totalOutstanding.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.pendingCount} órdenes pendientes
          </p>
        </CardContent>
      </Card>

      {/* Total Overdue */}
      <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Facturas Vencidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive">
            S/ {metrics.totalOverdue.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.overdueCount} órdenes vencidas
          </p>
        </CardContent>
      </Card>

      {/* Avg Days Overdue */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            Promedio Días de Retraso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
            {metrics.avgDaysOverdue.toFixed(0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">días promedio</p>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            Total Pagado (30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 dark:text-green-500">
            S/ {metrics.totalPaid.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.partialPaidCount} pagos parciales
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

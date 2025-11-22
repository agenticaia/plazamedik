import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ExternalLink, DollarSign } from "lucide-react";
import { PaymentSummary } from "@/hooks/usePaymentDashboard";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface OverdueInvoicesTableProps {
  paymentSummary?: PaymentSummary[];
  isLoading: boolean;
}

export const OverdueInvoicesTable = ({ paymentSummary, isLoading }: OverdueInvoicesTableProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturas Vencidas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const overdueInvoices = paymentSummary
    ?.filter((po) => po.payment_status === "OVERDUE" || po.days_overdue > 0)
    .sort((a, b) => b.days_overdue - a.days_overdue) || [];

  const getSeverityBadge = (days: number) => {
    if (days >= 30) {
      return (
        <Badge variant="destructive" className="font-semibold">
          {days}d CRÍTICO
        </Badge>
      );
    } else if (days >= 14) {
      return (
        <Badge className="bg-orange-600 text-white hover:bg-orange-700 font-semibold">
          {days}d ALTO
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-amber-600 text-white hover:bg-amber-700 font-semibold">
          {days}d
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Facturas Vencidas - Acción Requerida
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {overdueInvoices.length} {overdueInvoices.length === 1 ? "factura vencida" : "facturas vencidas"} que
          requieren atención inmediata
        </p>
      </CardHeader>
      <CardContent>
        {overdueInvoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">✅ No hay facturas vencidas</p>
            <p className="text-sm text-muted-foreground mt-2">Todos los pagos están al día</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Orden</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Días Vencido</TableHead>
                  <TableHead className="text-right">Balance Pendiente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className={`${
                      invoice.days_overdue >= 30
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : invoice.days_overdue >= 14
                        ? "bg-orange-500/5 hover:bg-orange-500/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <TableCell className="font-mono text-sm font-semibold">{invoice.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.supplier_name}</div>
                        {invoice.payment_terms && (
                          <div className="text-xs text-muted-foreground">Términos: {invoice.payment_terms}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.expected_delivery_date ? (
                        <div className="text-sm">
                          {format(new Date(invoice.expected_delivery_date), "dd MMM yyyy", { locale: es })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getSeverityBadge(invoice.days_overdue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold text-lg text-destructive">
                        S/ {invoice.balance_due.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </div>
                      {invoice.advance_payment_amount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          (Anticipo: S/ {invoice.advance_payment_amount.toFixed(2)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/admin/ordenes-compra")}
                        className="gap-1"
                      >
                        <DollarSign className="h-3 w-3" />
                        Registrar Pago
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

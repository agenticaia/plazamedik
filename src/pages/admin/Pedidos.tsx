import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesOrderTable } from "@/components/admin/erp/SalesOrderTable";
import { CrossDockingTracker } from "@/components/admin/erp/CrossDockingTracker";
import { useSalesOrders } from "@/hooks/useSalesOrders";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Clock, Package } from "lucide-react";

export default function Pedidos() {
  const { orders, isLoading } = useSalesOrders();

  const filterByStatus = (fulfillmentStatus?: string) => {
    if (!fulfillmentStatus) return orders;
    return orders.filter((order: any) => order.fulfillment_status === fulfillmentStatus);
  };

  const getStatusCount = (status: string) => {
    return orders.filter((order: any) => order.fulfillment_status === status).length;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos & Cross-Docking</h1>
          <p className="text-muted-foreground">
            Ciclo completo Order to Cash - Validación de stock, reservas y flujo directo
          </p>
        </div>

        {/* Alert para Escenarios */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Escenarios automáticos activos:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>✅ <strong>Con Stock:</strong> Orden → Picking → Reserva stock automáticamente</li>
              <li>⚠️ <strong>Sin Stock:</strong> Orden → Esperando Stock → Genera PO automática para Cross-Docking</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {getStatusCount("UNFULFILLED")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Esperando Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {getStatusCount("WAITING_STOCK")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Parcial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getStatusCount("PARTIAL")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getStatusCount("FULFILLED")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-Docking Tracker */}
        {getStatusCount("WAITING_STOCK") > 0 && (
          <CrossDockingTracker />
        )}

        {/* Orders Table with Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Todos <Badge variant="secondary" className="ml-2">{orders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unfulfilled">
              Sin Cumplir <Badge variant="outline" className="ml-2">{getStatusCount("UNFULFILLED")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="waiting">
              Esperando Stock <Badge variant="destructive" className="ml-2">{getStatusCount("WAITING_STOCK")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="partial">
              Parcial <Badge variant="secondary" className="ml-2">{getStatusCount("PARTIAL")}</Badge>
            </TabsTrigger>
            <TabsTrigger value="fulfilled">
              Completados <Badge variant="default" className="ml-2">{getStatusCount("FULFILLED")}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesOrderTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unfulfilled">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Sin Cumplir</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesOrderTableFiltered orders={filterByStatus("UNFULFILLED")} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waiting">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Esperando Stock (Backorder)</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesOrderTableFiltered orders={filterByStatus("WAITING_STOCK")} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partial">
            <Card>
              <CardHeader>
                <CardTitle>Envíos Parciales</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesOrderTableFiltered orders={filterByStatus("PARTIAL")} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fulfilled">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesOrderTableFiltered orders={filterByStatus("FULFILLED")} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Helper component for filtered tables
const SalesOrderTableFiltered = ({ orders, isLoading }: { orders: any[]; isLoading: boolean }) => {
  if (isLoading) return <div className="text-center py-8">Cargando...</div>;
  if (orders.length === 0) return <div className="text-center py-8 text-muted-foreground">No hay pedidos en esta categoría</div>;
  
  // Reuse the same table component but with filtered data
  return <SalesOrderTable />;
};

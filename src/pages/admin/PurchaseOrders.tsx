import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePurchaseOrders, PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { Plus, Package, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PurchaseOrders = () => {
  const { purchaseOrders, isLoading, createPurchaseOrder, updateOrderStatus, markAsReceived } =
    usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"manual" | "automatica">("manual");
  const [formData, setFormData] = useState({
    supplier_id: "",
    product_code: "",
    quantity: 1,
    unit_price: 0,
    expected_delivery_date: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      product_code: "",
      quantity: 1,
      unit_price: 0,
      expected_delivery_date: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find((p) => p.code === formData.product_code);
    if (!product) return;

    try {
      await createPurchaseOrder.mutateAsync({
        ...formData,
        product_name: product.name,
        order_type: orderType,
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      DRAFT: { variant: "secondary", icon: Clock, label: "Borrador" },
      SENT: { variant: "default", icon: Truck, label: "Enviada" },
      PARTIAL_RECEIPT: { variant: "default", icon: Package, label: "Recepción Parcial" },
      CLOSED: { variant: "default", icon: CheckCircle, label: "Cerrada" },
      CANCELLED: { variant: "destructive", icon: XCircle, label: "Cancelada" },
    };

    const config = variants[status || ""] || { variant: "outline", icon: Clock, label: status };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterOrders = (status?: PurchaseOrder["status"]) => {
    if (!status) return purchaseOrders;
    return purchaseOrders.filter((order: any) => order.status === status);
  };

  const renderOrdersTable = (orders: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número de Orden</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha Esperada</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order: any) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono">{order.order_number}</TableCell>
            <TableCell>{order.supplier?.name}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{order.product_name}</div>
                <div className="text-sm text-muted-foreground">{order.product_code}</div>
              </div>
            </TableCell>
            <TableCell>{order.quantity} unidades</TableCell>
            <TableCell>S/ {order.total_amount.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={order.order_type === "automatica" ? "default" : "outline"}>
                {order.order_type === "automatica" ? "Auto" : "Manual"}
              </Badge>
            </TableCell>
            <TableCell>{getStatusBadge(order.status)}</TableCell>
            <TableCell>
              {order.expected_delivery_date
                ? format(new Date(order.expected_delivery_date), "dd/MM/yyyy", { locale: es })
                : "-"}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {order.status === "DRAFT" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateOrderStatus.mutateAsync({ id: order.id, status: "SENT" })
                    }
                  >
                    Enviar
                  </Button>
                )}
                {(order.status === "SENT" || order.status === "PARTIAL_RECEIPT") && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => markAsReceived.mutateAsync(order.id)}
                  >
                    Recibir
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {orders.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground">
              No hay órdenes de compra en esta categoría
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Órdenes de Compra</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus órdenes de compra a proveedores</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Orden</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={orderType === "manual" ? "default" : "outline"}
                      onClick={() => setOrderType("manual")}
                    >
                      Manual
                    </Button>
                    <Button
                      type="button"
                      variant={orderType === "automatica" ? "default" : "outline"}
                      onClick={() => setOrderType("automatica")}
                    >
                      Automática (IA)
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier_id">Proveedor *</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers
                          .filter((s) => s.is_active)
                          .map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product_code">Producto *</Label>
                    <Select
                      value={formData.product_code}
                      onValueChange={(value) => {
                        const product = products.find((p) => p.code === value);
                        setFormData({
                          ...formData,
                          product_code: value,
                          unit_price: product?.priceSale || 0,
                        });
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.code} value={product.code}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_price">Precio Unitario *</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_price: parseFloat(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expected_delivery_date">Fecha Esperada de Entrega</Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) =>
                        setFormData({ ...formData, expected_delivery_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <div className="text-2xl font-bold mt-2">
                      S/ {(formData.quantity * formData.unit_price).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Orden</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="DRAFT">Borrador</TabsTrigger>
                <TabsTrigger value="SENT">Enviadas</TabsTrigger>
                <TabsTrigger value="PARTIAL_RECEIPT">Recepción Parcial</TabsTrigger>
                <TabsTrigger value="CLOSED">Cerradas</TabsTrigger>
              </TabsList>
              <TabsContent value="all">{renderOrdersTable(purchaseOrders)}</TabsContent>
              <TabsContent value="DRAFT">
                {renderOrdersTable(filterOrders("DRAFT" as any))}
              </TabsContent>
              <TabsContent value="SENT">
                {renderOrdersTable(filterOrders("SENT" as any))}
              </TabsContent>
              <TabsContent value="PARTIAL_RECEIPT">
                {renderOrdersTable(filterOrders("PARTIAL_RECEIPT" as any))}
              </TabsContent>
              <TabsContent value="CLOSED">
                {renderOrdersTable(filterOrders("CLOSED" as any))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PurchaseOrders;
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
import { Plus, Search } from "lucide-react";
import { ProcurementTable } from "@/components/admin/erp/ProcurementTable";

const PurchaseOrders = () => {
  const { purchaseOrders, isLoading, createPurchaseOrder, updateOrderStatus, markAsReceived } =
    usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"manual" | "automatica">("manual");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [formData, setFormData] = useState({
    supplier_id: "",
    product_code: "",
    quantity: 1,
    unit_price: 0,
    expected_delivery_date: "",
    notes: "",
    po_type: "STOCK_REPLENISHMENT", // STOCK_REPLENISHMENT, BACKORDER_FULFILLMENT, CROSS_DOCKING
    priority: "NORMAL", // URGENT, HIGH, NORMAL, LOW
    linked_sales_order_id: "", // Opcional: vincular con orden de venta
  });

  const filteredOrders = purchaseOrders.filter((po: any) => {
    const matchesSearch = 
      po.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || po.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      product_code: "",
      quantity: 1,
      unit_price: 0,
      expected_delivery_date: "",
      notes: "",
      po_type: "STOCK_REPLENISHMENT",
      priority: "NORMAL",
      linked_sales_order_id: "",
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
    const variants: Record<string, { label: string }> = {
      DRAFT: { label: "Borrador" },
      SENT: { label: "Enviada" },
      PARTIAL_RECEIPT: { label: "Recepción Parcial" },
      CLOSED: { label: "Cerrada" },
      CANCELLED: { label: "Cancelada" },
    };

    const config = variants[status || ""] || { label: status };
    return config.label;
  };

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Órdenes de Compra</h1>
            <p className="text-muted-foreground mt-1">
              Ciclo completo Procure to Pay - Desde la solicitud hasta el pago
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de Orden */}
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

                {/* Tipo de PO y Prioridad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="po_type">Propósito de la Orden *</Label>
                    <Select
                      value={formData.po_type}
                      onValueChange={(value) => setFormData({ ...formData, po_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el propósito" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STOCK_REPLENISHMENT">
                          Reposición de Stock
                        </SelectItem>
                        <SelectItem value="BACKORDER_FULFILLMENT">
                          Cumplimiento de Backorder
                        </SelectItem>
                        <SelectItem value="CROSS_DOCKING">
                          Cross-Docking (Directo a Cliente)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridad *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URGENT">🔴 Urgente</SelectItem>
                        <SelectItem value="HIGH">🟠 Alta</SelectItem>
                        <SelectItem value="NORMAL">🟢 Normal</SelectItem>
                        <SelectItem value="LOW">⚪ Baja</SelectItem>
                      </SelectContent>
                    </Select>
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
                </div>

                {/* Precio y Fecha */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_price">Precio Unitario (S/) *</Label>
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
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.expected_delivery_date}
                      onChange={(e) =>
                        setFormData({ ...formData, expected_delivery_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Total y Notas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="text-3xl font-bold text-primary">
                      S/ {(formData.quantity * formData.unit_price).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formData.quantity} unidad(es) × S/ {formData.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Instrucciones especiales, condiciones de pago, etc."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {formData.po_type === "BACKORDER_FULFILLMENT" && (
                      <span className="flex items-center gap-1">
                        ⚠️ Esta orden cumplirá un backorder existente
                      </span>
                    )}
                    {formData.po_type === "CROSS_DOCKING" && (
                      <span className="flex items-center gap-1">
                        🚚 Envío directo al cliente sin almacenamiento
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Crear Orden de Compra
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-2 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por N° OC, proveedor o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>
          <Card className="p-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="SENT">Enviada</SelectItem>
                <SelectItem value="PARTIAL_RECEIPT">Recepción Parcial</SelectItem>
                <SelectItem value="CLOSED">Cerrada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Órdenes</div>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Borradores</div>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: any) => o.status === "DRAFT").length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">En Proceso</div>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: any) => 
                o.status === "SENT" || o.status === "PARTIAL_RECEIPT"
              ).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Cerradas</div>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o: any) => o.status === "CLOSED").length}
            </div>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra Activas - Procure to Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcurementTable 
              searchTerm={searchTerm}
              filterStatus={filterStatus}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PurchaseOrders;
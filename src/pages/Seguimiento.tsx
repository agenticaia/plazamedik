import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Truck, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Helmet } from "react-helmet";

const Seguimiento = () => {
  const [orderCode, setOrderCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!orderCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código de seguimiento",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOrder(null);

    try {
      // Primero buscar en sales_orders (sistema nuevo)
      const { data: salesOrder, error: salesError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          items:sales_order_items(*)
        `)
        .eq("order_number", orderCode.trim().toUpperCase())
        .maybeSingle();

      if (salesOrder) {
        setOrder(salesOrder);
        return;
      }

      // Si no se encuentra, buscar en orders (sistema antiguo)
      const { data: oldOrder, error: oldError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_code", orderCode.trim().toUpperCase())
        .maybeSingle();

      if (oldOrder) {
        setOrder(oldOrder);
        return;
      }

      // Si no se encuentra en ninguna tabla
      toast({
        title: "Pedido no encontrado",
        description: "No encontramos un pedido con ese código. Verifica e intenta nuevamente.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error al buscar pedido:", error);
      toast({
        title: "Error",
        description: "No pudimos buscar tu pedido. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    // Mapeo de estados nuevos (sales_orders)
    const newStatusMap: Record<string, any> = {
      UNFULFILLED: {
        label: "En Preparación",
        icon: Package,
        color: "bg-yellow-500",
        description: "Tu pedido está siendo preparado",
      },
      PARTIAL: {
        label: "Envío Parcial",
        icon: Package,
        color: "bg-blue-500",
        description: "Parte de tu pedido ha sido enviado",
      },
      FULFILLED: {
        label: "Entregado",
        icon: CheckCircle2,
        color: "bg-green-500",
        description: "¡Tu pedido ha sido entregado con éxito!",
      },
      WAITING_STOCK: {
        label: "Esperando Stock",
        icon: Clock,
        color: "bg-orange-500",
        description: "Estamos esperando stock para completar tu pedido",
      },
      CANCELLED: {
        label: "Cancelado",
        icon: AlertTriangle,
        color: "bg-red-500",
        description: "Este pedido ha sido cancelado",
      },
    };

    // Mapeo de estados antiguos (orders)
    const oldStatusMap: Record<string, any> = {
      recibido: {
        label: "Recibido",
        icon: Clock,
        color: "bg-blue-500",
        description: "Tu pedido ha sido recibido y está siendo procesado",
      },
      preparacion: {
        label: "En Preparación",
        icon: Package,
        color: "bg-yellow-500",
        description: "Estamos preparando tu pedido para el envío",
      },
      enviado: {
        label: "Enviado",
        icon: Truck,
        color: "bg-purple-500",
        description: "Tu pedido está en camino",
      },
      entregado: {
        label: "Entregado",
        icon: CheckCircle2,
        color: "bg-green-500",
        description: "¡Tu pedido ha sido entregado con éxito!",
      },
      cancelado: {
        label: "Cancelado",
        icon: Clock,
        color: "bg-red-500",
        description: "Este pedido ha sido cancelado",
      },
    };

    return newStatusMap[status] || oldStatusMap[status] || {
      label: status,
      icon: Clock,
      color: "bg-gray-500",
      description: "Estado desconocido",
    };
  };

  return (
    <>
      <Helmet>
        <title>Seguimiento de Pedido | Plaza Medik - Medias de Compresión</title>
        <meta
          name="description"
          content="Rastrea tu pedido de medias de compresión RelaxSan en tiempo real. Ingresa tu código de seguimiento y conoce el estado actual de tu compra."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <WhatsAppFloat />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-bold text-foreground mb-4">Seguimiento de Pedido</h1>
                <p className="text-lg text-muted-foreground">
                  Ingresa tu código de seguimiento para ver el estado de tu pedido
                </p>
              </div>
            </div>
          </section>

          {/* Search Section */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-lg mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Buscar Pedido</CardTitle>
                    <CardDescription>Ingresa el código que recibiste al confirmar tu pedido</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="orderCode">Código de Seguimiento</Label>
                      <Input
                        id="orderCode"
                        placeholder="Ej: PLAZA-1234"
                        value={orderCode}
                        onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <Button onClick={handleSearch} className="w-full" disabled={isLoading}>
                      <Search className="w-4 h-4 mr-2" />
                      {isLoading ? "Buscando..." : "Buscar Pedido"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Order Details */}
                {order && (
                  <Card className="mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono">
                          {order.order_number || order.order_code}
                        </CardTitle>
                        <Badge variant="outline">
                          {new Date(order.created_at).toLocaleDateString("es-PE")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Estado del Pedido */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Estado del Pedido
                        </h4>
                        <div className="text-center py-6 bg-muted/50 rounded-lg">
                          {(() => {
                            const status = order.fulfillment_status || order.status;
                            const statusInfo = getStatusInfo(status);
                            const StatusIcon = statusInfo.icon;
                            return (
                              <>
                                <div
                                  className={`w-16 h-16 ${statusInfo.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                                >
                                  <StatusIcon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{statusInfo.label}</h3>
                                <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                              </>
                            );
                          })()}
                        </div>

                        {/* Payment Status Badge (solo para sales_orders) */}
                        {order.payment_status && (
                          <div className="flex justify-center">
                            <Badge variant={order.payment_status === 'PAID' ? 'default' : 'secondary'}>
                              {order.payment_status === 'PAID' ? '✅ Pagado' : '⏳ Pago Pendiente'}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Items del Pedido */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">
                          Items del Pedido ({order.items?.length || 1})
                        </h4>
                        <div className="space-y-3">
                          {order.items ? (
                            order.items.map((item: any, idx: number) => (
                              <div key={idx} className="bg-muted/30 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-foreground">{item.product_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      SKU: {item.product_code}
                                      {item.product_color && ` • Color: ${item.product_color}`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-primary">S/ {Number(item.unit_price).toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">Cant: {item.quantity}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                              <p className="text-sm">
                                <span className="text-muted-foreground">Producto:</span>{" "}
                                <span className="font-medium text-foreground">{order.product_name}</span>
                              </p>
                              {order.product_color && (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Color:</span>{" "}
                                  <span className="font-medium text-foreground">{order.product_color}</span>
                                </p>
                              )}
                              <p className="text-sm">
                                <span className="text-muted-foreground">Precio:</span>{" "}
                                <span className="font-bold text-primary">S/ {order.product_price}</span>
                              </p>
                            </div>
                          )}
                          
                          {/* Total */}
                          {order.total && (
                            <div className="flex justify-between items-center pt-2 border-t font-bold">
                              <span>Total:</span>
                              <span className="text-lg text-primary">S/ {Number(order.total).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Datos de entrega */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Datos de Entrega</h4>
                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Cliente:</span>{" "}
                            <span className="font-medium text-foreground">
                              {order.customer_name} {order.customer_lastname}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Teléfono:</span>{" "}
                            <span className="font-medium text-foreground">{order.customer_phone}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Distrito:</span>{" "}
                            <span className="font-medium text-foreground">{order.customer_district}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Seguimiento;

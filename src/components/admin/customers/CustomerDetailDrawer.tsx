import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Copy, Gift, ShoppingCart, TrendingUp, Calendar, Check } from "lucide-react";
import { useCustomerReferrals, useCustomerOrders, useCustomers, type Customer } from "@/hooks/useCustomers";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDrawer({ customer, open, onOpenChange }: CustomerDetailDrawerProps) {
  const { toast } = useToast();
  const { updateCustomerNotes } = useCustomers();
  const { data: referrals = [], isLoading: loadingReferrals } = useCustomerReferrals(customer?.id || "");
  const { data: orders = [], isLoading: loadingOrders } = useCustomerOrders(customer?.id || "");
  const [notes, setNotes] = useState(customer?.ai_notes || "");
  const [copied, setCopied] = useState(false);

  if (!customer) return null;

  const inviteUrl = `${window.location.origin}/invite/${customer.referral_code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: "¡Link copiado!",
        description: "El link de referido ha sido copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el link.",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = () => {
    updateCustomerNotes.mutate({ id: customer.id, notes });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">
            {customer.name} {customer.lastname}
          </SheetTitle>
          <SheetDescription>
            Cliente desde {format(new Date(customer.created_at), "PPP", { locale: es })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distrito</p>
                  <p className="font-medium">{customer.district || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="secondary">{customer.customer_type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{customer.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Pedidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">S/. {Number(customer.total_spent).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Gastado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">S/. {Number(customer.referral_credits).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Créditos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Programa de Referidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Programa de Referidos
              </CardTitle>
              <CardDescription>
                Comparte el link y gana S/. 15 por cada cliente nuevo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Código de referido</p>
                <div className="flex gap-2">
                  <code className="flex-1 relative rounded bg-muted px-3 py-2 font-mono text-sm">
                    {customer.referral_code}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Link para compartir</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button onClick={handleCopyLink}>
                    {copied ? "¡Copiado!" : "Copiar"}
                  </Button>
                </div>
              </div>

              {loadingReferrals ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Referidos exitosos ({referrals.length})
                  </p>
                  {referrals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aún no ha referido a ningún cliente
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">
                              {referral.referred_customer?.name} {referral.referred_customer?.lastname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(referral.created_at), "PPP", { locale: es })}
                            </p>
                          </div>
                          <Badge variant={referral.status === "COMPLETED" ? "default" : "secondary"}>
                            + S/. {referral.credit_amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay pedidos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "PPP", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">S/. {Number(order.total).toFixed(2)}</p>
                        <Badge variant="outline" className="text-xs">
                          {order.fulfillment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas y Observaciones IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observaciones IA</CardTitle>
              <CardDescription>
                Notas y recomendaciones para este cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Agregar observaciones sobre el cliente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveNotes} disabled={updateCustomerNotes.isPending}>
                {updateCustomerNotes.isPending ? "Guardando..." : "Guardar Notas"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

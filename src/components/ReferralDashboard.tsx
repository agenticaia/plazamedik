import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, ShoppingBag, Coins, Clock, CheckCircle2, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReferralDashboardProps {
  customer: {
    id: string;
    name: string;
    lastname?: string | null;
    phone: string;
    email?: string | null;
    district?: string | null;
    referral_code: string;
    referral_credits: number;
    total_orders?: number;
    total_spent?: number;
    created_at?: string | null;
  };
}

interface ReferralWithOrder {
  id: string;
  referral_code_used: string;
  credit_amount: number;
  status: string;
  created_at: string;
  referred_customer: {
    id: string;
    name: string;
    lastname: string | null;
  } | null;
  order: {
    id: string;
    order_number: string;
    total: number;
    payment_status: string;
    created_at: string;
  } | null;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  total: number;
  fulfillment_status: string;
  payment_status: string;
  created_at: string;
}

export default function ReferralDashboard({ customer }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  // Obtener referidos exitosos (solo los que tienen pedido PAGADO)
  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["my-referrals", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          referral_code_used,
          credit_amount,
          status,
          created_at,
          referred_customer:customers!referrals_referred_customer_id_fkey(id, name, lastname),
          order:sales_orders!referrals_order_id_fkey(id, order_number, total, payment_status, created_at)
        `)
        .eq("referrer_customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ReferralWithOrder[];
    },
    enabled: !!customer.id,
  });

  // Obtener historial de pedidos del cliente
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["customer-orders", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("id, order_number, total, fulfillment_status, payment_status, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomerOrder[];
    },
    enabled: !!customer.id,
  });

  const inviteLink = `${window.location.origin}/invite/${customer.referral_code}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(customer.referral_code);
      setCopied(true);
      toast({
        title: "¡Código copiado!",
        description: "Compártelo con tus amigos",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error al copiar",
        variant: "destructive",
      });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast({
        title: "¡Link copiado!",
        description: "Compártelo con tus amigos",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast({
        title: "Error al copiar",
        variant: "destructive",
      });
    }
  };

  const paidReferrals = referrals.filter(r => r.order?.payment_status === "PAID");
  const customerSince = customer.created_at 
    ? format(new Date(customer.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  const getFulfillmentLabel = (status: string) => {
    const labels: Record<string, string> = {
      'UNFULFILLED': 'Pendiente',
      'PICKING': 'Preparando',
      'PACKED': 'Empacado',
      'SHIPPED': 'Enviado',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header del cliente */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {customer.name} {customer.lastname}
        </h2>
        {customerSince && (
          <p className="text-sm text-muted-foreground">
            Cliente desde {customerSince}
          </p>
        )}
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Distrito</p>
              <p className="font-medium">{customer.district || "No especificado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{customer.email || "No especificado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <Badge variant="secondary" className="mt-1">REGULAR</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{customer.total_orders || orders.length}</p>
                <p className="text-xs text-muted-foreground">Pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">S/. {(customer.total_spent || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Gastado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">S/. {customer.referral_credits.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Créditos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Programa de Referidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5" />
            Programa de Referidos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparte el link y gana S/. 15 por cada cliente nuevo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Código de referido</p>
            <div className="flex gap-2">
              <Input 
                value={customer.referral_code} 
                readOnly 
                className="font-mono font-bold"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyCode}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Link para compartir</p>
            <div className="flex gap-2">
              <Input 
                value={inviteLink} 
                readOnly 
                className="text-xs"
              />
              <Button 
                onClick={copyLink}
                size="sm"
              >
                {copiedLink ? "¡Copiado!" : "Copiar"}
              </Button>
            </div>
          </div>

          {/* Referidos Exitosos */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">
              Referidos Exitosos ({paidReferrals.length})
            </h4>
            
            {isLoadingReferrals ? (
              <Skeleton className="h-20 w-full" />
            ) : paidReferrals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aún no ha referido a ningún cliente
              </p>
            ) : (
              <div className="space-y-2">
                {paidReferrals.map((referral) => (
                  <div 
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {referral.referred_customer?.name?.[0] || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {referral.referred_customer?.name} {referral.referred_customer?.lastname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {referral.order?.order_number} · S/. {referral.order?.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Pagado
                      </Badge>
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        +S/. {referral.credit_amount?.toFixed(2) || "15.00"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Historial de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no tiene pedidos
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">S/. {order.total.toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">
                      {getFulfillmentLabel(order.fulfillment_status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, ShoppingBag, Coins, CheckCircle2, Calendar, Share2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FavoritesSection from "./FavoritesSection";

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
  source: string | null;
}

export default function ReferralDashboard({ customer }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

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

  // Pedidos: por customer_id O por phone (cubre pedidos WhatsApp antiguos sin customer_id)
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["customer-orders", customer.id, customer.phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("id, order_number, total, fulfillment_status, payment_status, created_at, source")
        .or(`customer_id.eq.${customer.id},customer_phone.eq.${customer.phone}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomerOrder[];
    },
    enabled: !!customer.id,
  });

  const inviteLink = `${window.location.origin}/invite/${customer.referral_code}`;
  const shareMessage = `¡Hola! 🎁 Te regalo S/. 15 de descuento en Plaza Medik. Usa mi código *${customer.referral_code}* o entra a este link: ${inviteLink}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(customer.referral_code);
      setCopied(true);
      toast({ title: "¡Código copiado!", description: "Compártelo con tus amigos" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast({ title: "¡Link copiado!", description: "Compártelo con tus amigos" });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  const paidReferrals = referrals.filter((r) => r.order?.payment_status === "PAID");
  const customerSince = customer.created_at
    ? format(new Date(customer.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  const getFulfillmentLabel = (status: string) => {
    const labels: Record<string, string> = {
      UNFULFILLED: "Pendiente",
      PICKING: "Preparando",
      PACKED: "Empacado",
      SHIPPED: "Enviado",
      DELIVERED: "Entregado",
      CANCELLED: "Cancelado",
      WAITING_STOCK: "En espera de stock",
    };
    return labels[status] || status;
  };

  const getSourceLabel = (source: string | null) => {
    if (source === "whatsapp" || source === "whatsapp_manual") return "WhatsApp";
    if (source === "web") return "Web";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header del cliente */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-foreground">
          {customer.name} {customer.lastname}
        </h2>
        {customerSince && (
          <p className="text-sm text-muted-foreground">Cliente desde {customerSince}</p>
        )}
      </div>

      {/* 🎁 Código de Regalo destacado */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-primary" />
            Tu Código de Regalo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ganas S/. 15 cuando un amigo usa tu código y paga su pedido
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3 p-4 bg-background/60 backdrop-blur rounded-lg border border-primary/20">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Tu código exclusivo
            </p>
            <p className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-wider break-all text-center">
              {customer.referral_code}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" onClick={copyCode} className="w-full">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" /> Copiar código
                </>
              )}
            </Button>
            <Button variant="outline" onClick={copyLink} className="w-full">
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" /> Copiar link
                </>
              )}
            </Button>
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
              <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp
              </a>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-background/40 rounded p-2 break-all">
            {inviteLink}
          </div>

          {customer.referral_credits > 0 && (
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Coins className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm">
                Tienes <span className="font-bold text-green-700">S/. {customer.referral_credits.toFixed(2)}</span> en
                créditos para tu próximo pedido
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
              <Badge variant="secondary" className="mt-1">
                REGULAR
              </Badge>
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

      {/* ❤️ Mis Favoritos */}
      <FavoritesSection />

      {/* 👥 Referidos Exitosos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5" />
            Referidos Exitosos ({paidReferrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingReferrals ? (
            <Skeleton className="h-20 w-full" />
          ) : paidReferrals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no has referido a ningún cliente. ¡Comparte tu código!
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
        </CardContent>
      </Card>

      {/* 📅 Historial de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Historial de Pedidos ({orders.length})
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
              Aún no tienes pedidos
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const sourceLabel = getSourceLabel(order.source);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{order.order_number}</p>
                          {sourceLabel && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {sourceLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "d 'de' MMMM 'de' yyyy", {
                            locale: es,
                          })}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

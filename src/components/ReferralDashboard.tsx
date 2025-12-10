import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Copy, Check, Users, Coins, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReferralDashboardProps {
  customer: {
    id: string;
    name: string;
    referral_code: string;
    referral_credits: number;
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

export default function ReferralDashboard({ customer }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["my-referrals", customer.id],
    queryFn: async () => {
      // Obtener referidos con información del pedido
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

  const inviteLink = `${window.location.origin}/invite/${customer.referral_code}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "¡Link copiado!",
        description: "Compártelo con tus amigos",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error al copiar",
        description: "Intenta de nuevo",
        variant: "destructive",
      });
    }
  };

  const paidReferrals = referrals.filter(r => r.order?.payment_status === "PAID");
  const pendingReferrals = referrals.filter(r => r.order?.payment_status !== "PAID");

  return (
    <div className="space-y-6">
      {/* Header con código y créditos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tu código de referido */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-primary" />
              Tu Código de Referido
            </CardTitle>
            <CardDescription>
              Comparte este código y ambos ganan S/. 15
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background rounded-lg p-4 text-center">
              <code className="text-2xl font-bold text-primary tracking-wider">
                {customer.referral_code}
              </code>
            </div>
            
            <Button 
              onClick={copyToClipboard} 
              className="w-full"
              variant="outline"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link de Invitación
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Créditos acumulados */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="w-5 h-5 text-amber-600" />
              Tus Créditos
            </CardTitle>
            <CardDescription>
              Disponible para tu próxima compra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <span className="text-4xl font-bold text-amber-600">
                S/. {customer.referral_credits.toFixed(2)}
              </span>
              <p className="text-sm text-muted-foreground mt-2">
                Acumulados por {paidReferrals.length} referido{paidReferrals.length !== 1 ? 's' : ''} exitoso{paidReferrals.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{referrals.length}</p>
                <p className="text-xs text-muted-foreground">Total Referidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{paidReferrals.length}</p>
                <p className="text-xs text-muted-foreground">Pagados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReferrals.length}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Coins className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  S/. {paidReferrals.reduce((acc, r) => acc + (r.credit_amount || 15), 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Ganado Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de referidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Historial de Referidos
          </CardTitle>
          <CardDescription>
            Amigos que usaron tu código de referido
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Aún no tienes referidos</p>
              <p className="text-sm">¡Comparte tu código y comienza a ganar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {referral.referred_customer?.name?.[0] || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {referral.referred_customer?.name || "Cliente"}{" "}
                        {referral.referred_customer?.lastname || ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {referral.order ? (
                          <>
                            Pedido #{referral.order.order_number} · S/. {referral.order.total.toFixed(2)}
                          </>
                        ) : (
                          "Sin pedido asociado"
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(referral.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge
                      variant={
                        referral.order?.payment_status === "PAID"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        referral.order?.payment_status === "PAID"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {referral.order?.payment_status === "PAID" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Pagado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </>
                      )}
                    </Badge>
                    {referral.order?.payment_status === "PAID" && (
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        +S/. {referral.credit_amount?.toFixed(2) || "15.00"}
                      </p>
                    )}
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

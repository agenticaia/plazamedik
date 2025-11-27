import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, CheckCircle2, ArrowRight } from "lucide-react";
import { useValidateReferralCode } from "@/hooks/useCustomers";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const validateCode = useValidateReferralCode();
  const [referrer, setReferrer] = useState<any>(null);

  useEffect(() => {
    if (code) {
      // Guardar código en localStorage para usarlo en checkout
      localStorage.setItem("referral_code", code);
      
      // Validar el código
      validateCode.mutate(code, {
        onSuccess: (data) => {
          setReferrer(data);
        },
        onError: () => {
          // Si el código no es válido, limpiar localStorage
          localStorage.removeItem("referral_code");
        },
      });
    }
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {validateCode.isPending ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : validateCode.isError ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-destructive">Código Inválido</CardTitle>
                <CardDescription>
                  El código de referido que intentas usar no es válido o ha expirado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/")}>
                  Ir al Inicio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-primary/20">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="w-10 h-10 text-primary" />
                    </div>
                  </motion.div>
                  
                  <CardTitle className="text-3xl font-bold">
                    ¡Obtén S/. 15 de descuento!
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {referrer ? (
                      <>
                        <span className="font-semibold text-foreground">
                          {referrer.name} {referrer.lastname}
                        </span>
                        {" "}te ha invitado a PlazaMedik
                      </>
                    ) : (
                      "Has sido invitado a PlazaMedik"
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="bg-primary/5 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg">¿Cómo funciona?</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          <span className="font-semibold">Obtén S/. 15 de descuento</span> en tu primera compra
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          Tu amigo también <span className="font-semibold">recibe S/. 15</span> cuando completes tu pedido
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          <span className="font-semibold">Tú también puedes referir</span> y ganar créditos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Tu código de descuento:
                    </p>
                    <code className="text-2xl font-bold text-primary">
                      {code}
                    </code>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate("/catalogo")}
                  >
                    Empezar a Comprar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    El descuento se aplicará automáticamente en tu primera compra
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

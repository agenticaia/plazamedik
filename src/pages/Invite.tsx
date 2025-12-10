import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, CheckCircle2, ArrowRight, Sparkles, Users } from "lucide-react";
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

  // Si no hay código o es inválido, mostrar invitación a obtener uno
  const showGetCodePromo = !code || validateCode.isError;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Navigation muted />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {validateCode.isPending && code ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : showGetCodePromo ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-4"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                  
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    ¡Regala S/. 15 a tus amigos!
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Y tú también ganas S/. 15 cuando ellos compren
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="bg-white/60 dark:bg-white/10 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-600" />
                      Así funciona el programa de referidos
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold">Regístrate o inicia sesión</span> en PlazaMedik
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold">Obtén tu código único</span> de referido
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          3
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold">Compártelo</span> con amigos y familia
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                          ✓
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold">Ambos ganan S/. 15</span> cuando compren
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      size="lg" 
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                      onClick={() => navigate("/auth")}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Obtener Mi Código
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/catalogo")}
                    >
                      Ver Catálogo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    ¿Ya tienes cuenta? Inicia sesión para ver tu código de referido
                  </p>
                </CardContent>
              </Card>
            </motion.div>
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
